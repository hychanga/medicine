package com.medicine.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.auth.oauth2.GoogleCredentials;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Set;

/**
 * Google Cloud Vision 文字辨識（DOCUMENT_TEXT_DETECTION），直接呼叫 REST API。
 * 參考 family-tree 專案的 GoogleVisionOcr。
 *
 * <p>驗證方式（擇一，依序嘗試）：
 * <ol>
 *   <li>API 金鑰：{@code GOOGLE_VISION_API_KEY}</li>
 *   <li>Application Default Credentials：Cloud Run 上直接使用執行服務帳戶；
 *       本機可設定 {@code GOOGLE_APPLICATION_CREDENTIALS} 指向服務帳戶 JSON，
 *       或執行 {@code gcloud auth application-default login}。</li>
 * </ol>
 */
@Service
public class VisionOcrService {

    private static final Logger log = LoggerFactory.getLogger(VisionOcrService.class);

    private static final Set<String> SUPPORTED = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp");
    /** API 上限 20 MB（含 base64 膨脹），保留餘裕。 */
    public static final int MAX_IMAGE_BYTES = 8 * 1024 * 1024;
    private static final String SCOPE = "https://www.googleapis.com/auth/cloud-vision";

    private final String apiKey;
    private final String endpoint;
    private final List<String> languageHints;
    private final ObjectMapper json = new ObjectMapper();
    private final HttpClient http = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private volatile GoogleCredentials credentials;
    private volatile boolean adcUnavailable;

    public VisionOcrService(@Value("${app.vision.api-key:}") String apiKey,
                            @Value("${app.vision.endpoint:https://vision.googleapis.com/v1}") String endpoint,
                            @Value("${app.vision.language-hints:zh-Hant,en}") String languageHints) {
        this.apiKey = apiKey == null || apiKey.isBlank() ? null : apiKey.strip();
        this.endpoint = endpoint.replaceAll("/+$", "");
        this.languageHints = List.of(languageHints.split("\\s*,\\s*")).stream()
                .filter(s -> !s.isBlank()).toList();
    }

    public static boolean isSupported(String mime) {
        return mime != null && SUPPORTED.contains(mime);
    }

    /** 辨識單張圖片，回傳全文。失敗時丟出 ResponseStatusException。 */
    public String recognize(byte[] image, String mime) {
        if (!isSupported(mime)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "不支援的圖片格式：" + mime);
        }
        if (image.length > MAX_IMAGE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "圖片超過 8 MB");
        }
        try {
            ObjectNode req = json.createObjectNode();
            ObjectNode r = req.putArray("requests").addObject();
            r.putObject("image").put("content", Base64.getEncoder().encodeToString(image));
            r.putArray("features").addObject().put("type", "DOCUMENT_TEXT_DETECTION");
            if (!languageHints.isEmpty()) {
                ArrayNode hints = r.putObject("imageContext").putArray("languageHints");
                languageHints.forEach(hints::add);
            }
            JsonNode res = call("/images:annotate", req).path("responses").path(0);
            JsonNode err = res.path("error");
            if (err.has("message")) {
                throw new IOException(err.path("message").asText());
            }
            return res.path("fullTextAnnotation").path("text").asText("").strip();
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Google Vision OCR failed: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Google Vision 辨識失敗：" + e.getMessage());
        }
    }

    private JsonNode call(String path, ObjectNode body) throws IOException {
        String url = endpoint + path
                + (apiKey != null ? "?key=" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8) : "");
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(90))
                .header("Content-Type", "application/json; charset=utf-8")
                .POST(HttpRequest.BodyPublishers.ofByteArray(json.writeValueAsBytes(body)));
        if (apiKey == null) {
            b.header("Authorization", "Bearer " + accessToken());
        }
        HttpResponse<byte[]> res;
        try {
            res = http.send(b.build(), HttpResponse.BodyHandlers.ofByteArray());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("連線被中斷");
        }
        if (res.statusCode() / 100 != 2) {
            throw new IOException("HTTP " + res.statusCode() + "：" + errorMessage(res.body()));
        }
        return json.readTree(res.body());
    }

    private String accessToken() {
        if (adcUnavailable) throw notConfigured();
        try {
            GoogleCredentials c = credentials;
            if (c == null) {
                synchronized (this) {
                    if (credentials == null) {
                        credentials = GoogleCredentials.getApplicationDefault().createScoped(SCOPE);
                    }
                    c = credentials;
                }
            }
            c.refreshIfExpired();
            return c.getAccessToken().getTokenValue();
        } catch (IOException e) {
            log.warn("No Google credentials for Vision: {}", e.getMessage());
            adcUnavailable = true;
            throw notConfigured();
        }
    }

    private static ResponseStatusException notConfigured() {
        return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "尚未設定 Google Cloud Vision（請設定 GOOGLE_VISION_API_KEY 或服務帳戶憑證）");
    }

    private String errorMessage(byte[] body) {
        try {
            String m = json.readTree(body).path("error").path("message").asText(null);
            if (m != null) return m;
        } catch (IOException ignored) {
            // not JSON
        }
        String s = new String(body, StandardCharsets.UTF_8);
        return s.length() > 200 ? s.substring(0, 200) : s;
    }
}
