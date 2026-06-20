package com.medicine.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Generates a handful of searchable Chinese tags for a 養生 resource from its
 * title and summary, using the Gemini API. Degrades gracefully: if no API key
 * is configured or the call fails, it returns an empty list so the caller can
 * fall back to manual tags.
 */
@Service
public class GeminiTagService {

    private static final Logger log = LoggerFactory.getLogger(GeminiTagService.class);

    private final String apiKey;
    private final String model;
    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public GeminiTagService(@Value("${app.gemini.api-key:}") String apiKey,
                            @Value("${app.gemini.model:gemini-2.5-flash}") String model) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
    }

    public boolean isEnabled() {
        return !apiKey.isEmpty();
    }

    /** Returns up to ~8 tags, or an empty list if unavailable. */
    public List<String> generateTags(String title, String summary) {
        if (!isEnabled()) {
            return List.of();
        }
        try {
            String prompt = "你是中醫養生知識庫的標籤助手。請根據以下標題與概要，產生 5 到 8 個適合用於搜尋的繁體中文標籤"
                    + "（例如：症狀、食材、體質、功效、相關臟腑、養生主題）。只輸出標籤，用半形逗號分隔，不要加說明或編號。\n\n"
                    + "標題：" + safe(title) + "\n概要：" + safe(summary);

            ObjectNode root = mapper.createObjectNode();
            ArrayNode contents = root.putArray("contents");
            ObjectNode content = contents.addObject();
            content.putArray("parts").addObject().put("text", prompt);

            String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                    + model + ":generateContent?key=" + apiKey;
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(25))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(root)))
                    .build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() / 100 != 2) {
                log.warn("Gemini tag request failed ({}): {}", resp.statusCode(), resp.body());
                return List.of();
            }
            JsonNode body = mapper.readTree(resp.body());
            JsonNode textNode = body.path("candidates").path(0)
                    .path("content").path("parts").path(0).path("text");
            if (textNode.isMissingNode()) {
                return List.of();
            }
            return parseTags(textNode.asText());
        } catch (Exception e) {
            log.warn("Gemini tag generation error: {}", e.getMessage());
            return List.of();
        }
    }

    private List<String> parseTags(String text) {
        Set<String> out = new LinkedHashSet<>();
        for (String raw : text.replace('，', ',').replace('、', ',').split("[,\\n]")) {
            String tag = raw.trim().replaceAll("^[#0-9.\\-\\s]+", "").trim();
            if (!tag.isEmpty() && tag.length() <= 20) {
                out.add(tag);
            }
            if (out.size() >= 8) {
                break;
            }
        }
        return new ArrayList<>(out);
    }

    private String safe(String s) {
        return s == null ? "" : s;
    }
}
