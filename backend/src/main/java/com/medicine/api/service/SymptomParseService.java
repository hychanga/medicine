package com.medicine.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Fetches the content at a URL and asks Gemini to extract TCM symptom/formula
 * data from it. Returns a JSON object matching the symptom-group schema that
 * the caller can use to pre-fill the create/edit form.
 */
@Service
public class SymptomParseService {

    private static final Logger log = LoggerFactory.getLogger(SymptomParseService.class);

    private static final int MAX_CONTENT_CHARS = 40_000;

    private final String apiKey;
    private final String model;
    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    public SymptomParseService(@Value("${app.gemini.api-key:}") String apiKey,
                               @Value("${app.gemini.model:gemini-2.5-flash}") String model) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
    }

    public boolean isEnabled() {
        return !apiKey.isEmpty();
    }

    /**
     * Fetches {@code url} and returns a parsed symptom-group JSON node with
     * fields: name, category, description, formulas (array), points (array).
     * Throws ResponseStatusException on any failure.
     */
    public JsonNode parseUrl(String url) {
        if (!isEnabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "尚未設定 Gemini API 金鑰");
        }
        String content = fetchPageText(url);
        return callGemini(content, url);
    }

    private String fetchPageText(String url) {
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(20))
                    .header("User-Agent", "Mozilla/5.0 (compatible; TCM-Bot/1.0)")
                    .header("Accept", "text/html,text/plain,*/*")
                    .GET()
                    .build();
            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() / 100 != 2) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "無法取得網頁內容（狀態碼 " + resp.statusCode() + "）");
            }
            String body = resp.body();
            // Strip HTML tags for brevity; Gemini can still understand the content.
            body = body.replaceAll("<style[^>]*>[\\s\\S]*?</style>", " ")
                       .replaceAll("<script[^>]*>[\\s\\S]*?</script>", " ")
                       .replaceAll("<[^>]+>", " ")
                       .replaceAll("\\s{3,}", "  ")
                       .trim();
            if (body.length() > MAX_CONTENT_CHARS) {
                body = body.substring(0, MAX_CONTENT_CHARS) + "…（截斷）";
            }
            return body;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Failed to fetch URL {}: {}", url, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "無法取得網頁內容：" + e.getMessage());
        }
    }

    private JsonNode callGemini(String pageText, String sourceUrl) {
        try {
            String categories = "外感類、肺系類、脾胃類、婦科類、神志類、肝腎類";
            String prompt = "你是一位中醫藥知識整理助手。請從以下網頁內容中，提取一組症狀與方劑資料，以繁體中文整理後，"
                    + "回傳嚴格符合以下 JSON 格式的物件（僅輸出 JSON，不加說明或 Markdown 程式碼圍欄）：\n\n"
                    + "{\n"
                    + "  \"name\": \"症狀名稱（例如：失眠、感冒）\",\n"
                    + "  \"category\": \"分類（只能選：" + categories + " 其中一個）\",\n"
                    + "  \"description\": \"對此症狀的簡短概述（2–4 句）\",\n"
                    + "  \"formulas\": [\n"
                    + "    {\n"
                    + "      \"name\": \"方劑名\",\n"
                    + "      \"pattern\": \"辨證要點（典型症狀與證型）\",\n"
                    + "      \"composition\": \"組成藥材，以頓號分隔\",\n"
                    + "      \"usage\": \"煎服法與用量\",\n"
                    + "      \"notes\": \"禁忌與注意事項\"\n"
                    + "    }\n"
                    + "  ],\n"
                    + "  \"points\": [\"常用穴位代碼，如 LI4、ST36\"]\n"
                    + "}\n\n"
                    + "若找不到方劑，formulas 回傳空陣列；若找不到穴位，points 回傳空陣列。\n"
                    + "來源網址：" + sourceUrl + "\n\n"
                    + "---網頁內容---\n" + pageText;

            ObjectNode root = mapper.createObjectNode();
            ArrayNode contents = root.putArray("contents");
            contents.addObject().putArray("parts").addObject().put("text", prompt);

            String geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/"
                    + model + ":generateContent?key=" + apiKey;

            HttpRequest req = HttpRequest.newBuilder(URI.create(geminiUrl))
                    .timeout(Duration.ofSeconds(60))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(root)))
                    .build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() / 100 != 2) {
                log.warn("Gemini parse request failed ({}): {}", resp.statusCode(), resp.body());
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gemini API 呼叫失敗");
            }

            JsonNode body = mapper.readTree(resp.body());
            JsonNode textNode = body.path("candidates").path(0)
                    .path("content").path("parts").path(0).path("text");
            if (textNode.isMissingNode()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gemini 未返回有效回應");
            }
            String raw = textNode.asText().trim();
            // Strip markdown fences if present
            if (raw.startsWith("```")) {
                raw = raw.replaceAll("^```[a-z]*\\n?", "").replaceAll("\\n?```$", "").trim();
            }
            return mapper.readTree(raw);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Gemini symptom parse error: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI 解析失敗：" + e.getMessage());
        }
    }
}
