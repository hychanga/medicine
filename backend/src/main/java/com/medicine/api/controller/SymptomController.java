package com.medicine.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medicine.api.dto.SymptomGroupRequest;
import com.medicine.api.model.SymptomGroupEntity;
import com.medicine.api.repository.SymptomGroupRepository;
import com.medicine.api.service.SymptomParseService;
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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Symptom groups (症狀與方劑). GET is public (no JWT required); mutations are
 * restricted to admins configured via app.admin.emails.
 */
@RestController
@RequestMapping("/api/symptoms")
public class SymptomController {

    private final SymptomGroupRepository repository;
    private final SymptomParseService parseService;
    private final ObjectMapper mapper = new ObjectMapper();
    private final Set<String> adminEmails;

    public SymptomController(SymptomGroupRepository repository,
                             SymptomParseService parseService,
                             @Value("${app.admin.emails:}") String admins) {
        this.repository = repository;
        this.parseService = parseService;
        this.adminEmails = Arrays.stream(admins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
    }

    @GetMapping
    public List<JsonNode> list() {
        return repository.findAllByOrderBySortOrderAscCreatedAtAsc()
                .stream()
                .map(this::toJson)
                .collect(Collectors.toList());
    }

    @PostMapping
    public JsonNode create(@AuthenticationPrincipal Jwt jwt,
                           @RequestBody SymptomGroupRequest req) {
        String email = requireAdmin(jwt);
        SymptomGroupEntity e = new SymptomGroupEntity();
        apply(e, req);
        e.setCreatedBy(email);
        return toJson(repository.save(e));
    }

    @PutMapping("/{id}")
    public JsonNode update(@AuthenticationPrincipal Jwt jwt,
                           @PathVariable Long id,
                           @RequestBody SymptomGroupRequest req) {
        requireAdmin(jwt);
        SymptomGroupEntity e = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到此病徵"));
        apply(e, req);
        return toJson(repository.save(e));
    }

    @DeleteMapping("/{id}")
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        requireAdmin(jwt);
        repository.deleteById(id);
    }

    /** Admin pastes a URL; Gemini extracts TCM data and returns a pre-fill payload. */
    @PostMapping("/parse-url")
    public JsonNode parseUrl(@AuthenticationPrincipal Jwt jwt,
                             @RequestBody Map<String, String> body) {
        requireAdmin(jwt);
        String url = body.get("url");
        if (url == null || url.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "請提供 url");
        }
        return parseService.parseUrl(url.trim());
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String requireAdmin(Jwt jwt) {
        String email = jwt == null ? null : jwt.getClaimAsString("email");
        if (email == null || !adminEmails.contains(email.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "僅限管理員維護症狀資料");
        }
        return email;
    }

    private void apply(SymptomGroupEntity e, SymptomGroupRequest req) {
        if (req.getName() == null || req.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "名稱不可空白");
        }
        e.setName(req.getName().trim());
        e.setCategory(trimToNull(req.getCategory()));
        e.setDescription(req.getDescription());
        e.setFormulas(normalizeJson(req.getFormulas(), "[]"));
        e.setPoints(normalizeJson(req.getPoints(), "[]"));
        e.setSourceUrl(trimToNull(req.getSourceUrl()));
        e.setSortOrder(req.getSortOrder());
    }

    private JsonNode toJson(SymptomGroupEntity e) {
        ObjectNode node = mapper.createObjectNode();
        node.put("id", e.getId());
        node.put("name", e.getName());
        node.put("category", e.getCategory() != null ? e.getCategory() : "");
        node.put("description", e.getDescription() != null ? e.getDescription() : "");
        node.set("formulas", parseJsonArray(e.getFormulas()));
        node.set("points", parseJsonArray(e.getPoints()));
        if (e.getSourceUrl() != null) node.put("sourceUrl", e.getSourceUrl());
        if (e.getSortOrder() != null) node.put("sortOrder", e.getSortOrder());
        node.put("createdAt", e.getCreatedAt() != null ? e.getCreatedAt().toString() : "");
        node.put("updatedAt", e.getUpdatedAt() != null ? e.getUpdatedAt().toString() : "");
        return node;
    }

    private ArrayNode parseJsonArray(String json) {
        if (json == null || json.isBlank()) return mapper.createArrayNode();
        try {
            JsonNode n = mapper.readTree(json);
            return n.isArray() ? (ArrayNode) n : mapper.createArrayNode();
        } catch (Exception ex) {
            return mapper.createArrayNode();
        }
    }

    private String normalizeJson(String json, String fallback) {
        if (json == null || json.isBlank()) return fallback;
        try {
            mapper.readTree(json);
            return json;
        } catch (Exception ex) {
            return fallback;
        }
    }

    private String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
