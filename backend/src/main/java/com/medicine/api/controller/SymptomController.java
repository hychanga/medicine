package com.medicine.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medicine.api.dto.SymptomGroupRequest;
import com.medicine.api.model.SymptomGroupEntity;
import com.medicine.api.repository.SymptomGroupRepository;
import com.medicine.api.service.GcsStorageService;
import com.medicine.api.service.PrescriptionParser;
import com.medicine.api.service.SymptomParseService;
import com.medicine.api.service.VisionOcrService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Symptom groups (症狀與方劑). GET is public (no JWT required); mutations are
 * restricted to admins configured via app.admin.emails.
 *
 * <p>資料來源分兩種：sourceType = "web"（網路整理）與 "scan"（看診方劑掃描）。
 * 掃描圖片經 Google Cloud Vision 辨識文字，再由 {@link PrescriptionParser} 以規則整理成草稿
 * （不使用 AI），圖片存到公開的 GCS bucket。
 */
@RestController
@RequestMapping("/api/symptoms")
public class SymptomController {

    private static final Logger log = LoggerFactory.getLogger(SymptomController.class);
    private static final String SCAN = "scan";
    private static final int MAX_SCAN_FILES = 6;

    private final SymptomGroupRepository repository;
    private final SymptomParseService parseService;
    private final VisionOcrService visionOcr;
    private final GcsStorageService storage;
    private final ObjectMapper mapper = new ObjectMapper();
    private final Set<String> adminEmails;

    public SymptomController(SymptomGroupRepository repository,
                             SymptomParseService parseService,
                             VisionOcrService visionOcr,
                             GcsStorageService storage,
                             @Value("${app.admin.emails:}") String admins) {
        this.repository = repository;
        this.parseService = parseService;
        this.visionOcr = visionOcr;
        this.storage = storage;
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

    /**
     * 上傳看診方劑的掃描圖片（處方箋、藥袋…，可多張）。每張以 Google Cloud Vision 辨識文字，
     * 圖片存到 GCS（symptoms/scans/...），再以規則整理成症狀方劑草稿（不使用 AI）。
     * 回傳 { ocrText, imageUrls:[...], draft:{...} | null, draftError?, uploadError? }。
     */
    @PostMapping(value = "/parse-scan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public JsonNode parseScan(@AuthenticationPrincipal Jwt jwt,
                              @RequestParam("files") List<MultipartFile> files) {
        requireAdmin(jwt);
        if (files == null || files.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "請選擇要辨識的圖片");
        }
        if (files.size() > MAX_SCAN_FILES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "一次最多 " + MAX_SCAN_FILES + " 張圖片");
        }

        ObjectNode out = mapper.createObjectNode();
        ArrayNode urls = out.putArray("imageUrls");
        StringBuilder allText = new StringBuilder();
        String uploadError = null;
        int n = 0;
        for (MultipartFile f : files) {
            n++;
            String mime = f.getContentType();
            if (!VisionOcrService.isSupported(mime)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "第 " + n + " 個檔案不是支援的圖片格式（JPEG、PNG、WebP、GIF、BMP）");
            }
            byte[] bytes;
            try {
                bytes = f.getBytes();
            } catch (IOException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "無法讀取上傳的圖片");
            }
            String text = PrescriptionParser.clean(visionOcr.recognize(bytes, mime));

            if (uploadError == null) {
                try {
                    String object = "symptoms/scans/" + System.currentTimeMillis() + "-"
                            + UUID.randomUUID().toString().substring(0, 8) + extension(mime);
                    urls.add(storage.upload(object, mime, bytes));
                } catch (Exception ex) {
                    log.warn("Scan image upload to GCS failed: {}", ex.getMessage());
                    uploadError = "圖片未能存到雲端（" + ex.getMessage() + "），仍可儲存辨識內容";
                }
            }

            if (files.size() > 1) {
                if (allText.length() > 0) allText.append("\n\n");
                allText.append("【第 ").append(n).append(" 張】\n");
            }
            allText.append(text);
        }
        if (uploadError != null) out.put("uploadError", uploadError);

        String ocrText = allText.toString().strip();
        out.put("ocrText", ocrText);
        if (ocrText.isBlank()) {
            out.putNull("draft");
            out.put("draftError", "圖片中沒有辨識到文字，請確認照片清晰、文字方向正確");
        } else {
            PrescriptionParser.Draft draft = PrescriptionParser.parse(ocrText);
            out.set("draft", mapper.valueToTree(draft));
            if (draft.formulas().isEmpty()) {
                out.put("draftError", "沒有自動找到方劑，請對照辨識原文手動填寫");
            }
        }
        return out;
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String requireAdmin(Jwt jwt) {
        String email = jwt == null ? null : jwt.getClaimAsString("email");
        if (email == null || !adminEmails.contains(email.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "僅限管理員維護症狀資料");
        }
        return email;
    }

    private static String extension(String mime) {
        return switch (mime) {
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            case "image/bmp" -> ".bmp";
            default -> ".jpg";
        };
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
        boolean scan = SCAN.equals(req.getSourceType());
        e.setSourceType(scan ? SCAN : "web");
        if (scan) {
            e.setVisitDate(parseDate(req.getVisitDate()));
            e.setClinic(trimToNull(req.getClinic()));
            e.setOcrText(req.getOcrText());
            e.setImageUrls(toJsonArray(req.getImageUrls()));
        } else {
            e.setVisitDate(null);
            e.setClinic(null);
            e.setOcrText(null);
            e.setImageUrls(null);
        }
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
        node.put("sourceType", e.getSourceType() != null ? e.getSourceType() : "web");
        if (e.getVisitDate() != null) node.put("visitDate", e.getVisitDate().toString());
        if (e.getClinic() != null) node.put("clinic", e.getClinic());
        if (e.getOcrText() != null) node.put("ocrText", e.getOcrText());
        node.set("imageUrls", parseJsonArray(e.getImageUrls()));
        node.put("createdAt", e.getCreatedAt() != null ? e.getCreatedAt().toString() : "");
        node.put("updatedAt", e.getUpdatedAt() != null ? e.getUpdatedAt().toString() : "");
        return node;
    }

    private String toJsonArray(List<String> list) {
        if (list == null || list.isEmpty()) return null;
        ArrayNode arr = mapper.createArrayNode();
        list.stream().filter(s -> s != null && !s.isBlank()).forEach(arr::add);
        return arr.toString();
    }

    private static LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return LocalDate.parse(s.trim());
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "看診日期格式應為 yyyy-MM-dd");
        }
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
