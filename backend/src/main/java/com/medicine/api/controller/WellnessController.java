package com.medicine.api.controller;

import com.medicine.api.dto.WellnessRequest;
import com.medicine.api.model.WellnessResource;
import com.medicine.api.repository.WellnessResourceRepository;
import com.medicine.api.service.GeminiTagService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 養生 resources. Anyone signed in can read/search; only an admin
 * (app.admin.emails) may create/update/delete. On write, if no tags are given,
 * Gemini generates them from the title + summary.
 */
@RestController
@RequestMapping("/api/wellness")
public class WellnessController {

    private final WellnessResourceRepository repository;
    private final GeminiTagService tagService;
    private final Set<String> adminEmails;

    public WellnessController(WellnessResourceRepository repository,
                             GeminiTagService tagService,
                             @Value("${app.admin.emails:}") String admins) {
        this.repository = repository;
        this.tagService = tagService;
        this.adminEmails = Arrays.stream(admins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
    }

    @GetMapping
    public List<WellnessResource> list(@RequestParam(name = "q", required = false) String q) {
        if (q == null || q.isBlank()) {
            return repository.findAllByOrderByCreatedAtDesc();
        }
        return repository.search(q.trim());
    }

    @GetMapping("/{id}")
    public WellnessResource get(@PathVariable Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到此養生資料"));
    }

    @PostMapping
    public WellnessResource create(@AuthenticationPrincipal Jwt jwt,
                                  @RequestBody WellnessRequest request) {
        String email = requireAdmin(jwt);
        WellnessResource w = new WellnessResource();
        apply(w, request);
        w.setCreatedBy(email);
        if (isBlank(w.getTags())) {
            w.setTags(autoTags(w));
        }
        return repository.save(w);
    }

    @PutMapping("/{id}")
    public WellnessResource update(@AuthenticationPrincipal Jwt jwt,
                                  @PathVariable Long id,
                                  @RequestBody WellnessRequest request) {
        requireAdmin(jwt);
        WellnessResource w = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到此養生資料"));
        apply(w, request);
        if (isBlank(w.getTags())) {
            w.setTags(autoTags(w));
        }
        return repository.save(w);
    }

    /** Regenerate tags from the current title + summary via Gemini. */
    @PostMapping("/{id}/retag")
    public WellnessResource retag(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        requireAdmin(jwt);
        WellnessResource w = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到此養生資料"));
        if (!tagService.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "尚未設定 Gemini API 金鑰");
        }
        w.setTags(autoTags(w));
        return repository.save(w);
    }

    @DeleteMapping("/{id}")
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        requireAdmin(jwt);
        repository.deleteById(id);
    }

    private String requireAdmin(Jwt jwt) {
        String email = jwt == null ? null : jwt.getClaimAsString("email");
        if (email == null || !adminEmails.contains(email.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "僅限管理員維護養生資料");
        }
        return email;
    }

    private void apply(WellnessResource w, WellnessRequest r) {
        if (isBlank(r.getTitle())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "標題不可空白");
        }
        w.setTitle(r.getTitle().trim());
        w.setSummary(r.getSummary());
        w.setVideoUrl(trimToNull(r.getVideoUrl()));
        w.setPdfUrl(trimToNull(r.getPdfUrl()));
        w.setCategory(trimToNull(r.getCategory()));
        w.setSource(trimToNull(r.getSource()));
        w.setTags(trimToNull(r.getTags()));
    }

    private String autoTags(WellnessResource w) {
        List<String> tags = tagService.generateTags(w.getTitle(), w.getSummary());
        return tags.isEmpty() ? null : String.join(",", tags);
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
