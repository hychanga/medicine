package com.medicine.api.service;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 不靠 AI，用規則從中醫處方箋 / 藥袋的 OCR 文字整理出草稿：
 * 看診日期（含民國年）、診所與醫師、診斷，以及方劑名稱、劑量、服法。
 * 找不到的欄位留空，讓使用者對照辨識原文自行補上。
 */
public final class PrescriptionParser {

    public record Formula(String name, String pattern, String composition, String usage, String notes) {}

    public record Draft(String name, String category, String description, String visitDate,
                        String clinic, List<Formula> formulas, List<String> points) {}

    private PrescriptionParser() {}

    // 與 family-tree OcrEngine.clean 相同：去掉中文字之間多餘的空白
    private static final Pattern CJK_GAP = Pattern.compile(
            "(?<=[\\p{IsHan}，。、；：！？「」『』（）])[ \\t]+(?=[\\p{IsHan}，。、；：！？「」『』（）])");

    private static final Pattern DATE = Pattern.compile(
            "(?<!\\d)(\\d{2,4})\\s*[/.\\-年]\\s*(\\d{1,2})\\s*[/.\\-月]\\s*(\\d{1,2})(?!\\d)");
    private static final Pattern COMPACT_DATE = Pattern.compile("(?<!\\d)(1\\d{2}|20\\d{2})(\\d{2})(\\d{2})(?!\\d)");
    private static final Pattern DATE_HINT = Pattern.compile("看診|就診|門診|調劑|開立|處方日|日期|日\\s*期");
    private static final Pattern DATE_SKIP = Pattern.compile("生日|出生|生\\s*日|有效|期限|到期|保存");

    private static final Pattern CLINIC = Pattern.compile(
            "([\\p{IsHan}A-Za-z]{2,16}?(?:中醫診所|中醫醫院|中醫院|國醫診所|診所|醫院|醫療社團法人[\\p{IsHan}]{2,12}))");
    private static final Pattern DOCTOR = Pattern.compile(
            "(?:醫師|醫生|主治)\\s*[:：]?\\s*([\\p{IsHan}]{2,4})|([\\p{IsHan}]{2,4})\\s*(?:醫師|醫生)(?!\\s*[:：])");
    private static final Pattern DIAGNOSIS = Pattern.compile(
            "(?:診斷|病名|主訴|症狀|病症|證型|辨證)\\s*[:：]\\s*(.+)");

    /** 方劑 / 藥材名 + 劑量，例如「加味逍遙散 4.0g」「酸棗仁湯：3」「夜交藤1.5克」。 */
    private static final Pattern ITEM = Pattern.compile(
            "([\\p{IsHan}]{2,10}(?:[（(][\\p{IsHan}]{1,6}[)）])?)\\s*[:：]?\\s*(\\d{1,3}(?:\\.\\d{1,2})?)\\s*(公克|克|gm|g|G|錢)?");
    private static final Pattern FORMULA_SUFFIX = Pattern.compile("(湯|散|丸|飲|丹|膏|方|片|粉|顆粒)$");
    private static final Set<String> STOP_WORDS = Set.of(
            "日期", "年齡", "病歷", "病歷號", "電話", "地址", "金額", "合計", "總計", "總量", "部分負擔",
            "掛號費", "藥費", "自費", "健保", "天數", "日數", "次數", "每日", "一日", "每天", "共計",
            "身分證", "統一編號", "編號", "卡號", "序號", "體重", "身高", "診別", "科別", "藥日", "給藥");
    private static final Pattern STOP_CHARS = Pattern.compile(
            "姓名|病歷|電話|地址|日期|元|歲|號|年|月|天|次|包|錢數|合計|總|費|負擔|身分|編號|共");

    private static final Pattern[] USAGE = {
            Pattern.compile("(?:每日|一日|每天|日服|一天)\\s*[一二三四五1-5]\\s*次"),
            Pattern.compile("(?:三餐|早晚|早午晚)?\\s*(?:飯前|飯後|餐前|餐後|睡前|空腹)(?:\\s*(?:半|一|1)\\s*小時)?"),
            Pattern.compile("(?:溫開水|溫水)\\s*(?:沖服|送服|吞服)?"),
            Pattern.compile("(?:共|服用|給藥|處方)\\s*\\d{1,3}\\s*(?:天|日)"),
            Pattern.compile("\\d{1,3}\\s*(?:天|日)份"),
    };

    public static String clean(String text) {
        if (text == null) return "";
        String t = text.replace("\r\n", "\n").replace('\f', '\n');
        t = CJK_GAP.matcher(t).replaceAll("");
        return t.replaceAll("[ \\t]+\\n", "\n").replaceAll("\\n{3,}", "\n\n").strip();
    }

    public static Draft parse(String rawText) {
        String text = clean(rawText);
        List<String> lines = text.lines().map(String::strip).filter(l -> !l.isEmpty()).toList();

        String visitDate = findDate(lines);
        String clinic = findClinic(lines);
        String diagnosis = findDiagnosis(lines);
        String usage = findUsage(text);

        Map<String, Formula> formulas = new LinkedHashMap<>();
        for (String line : lines) {
            if (DIAGNOSIS.matcher(line).find() || DATE.matcher(line).find()) continue;
            Matcher m = ITEM.matcher(line);
            while (m.find()) {
                String name = trimName(m.group(1));
                String dose = m.group(2);
                String unit = m.group(3);
                if (name == null || formulas.containsKey(name)) continue;
                boolean formulaLike = FORMULA_SUFFIX.matcher(name).find();
                if (unit == null && !dose.contains(".") && !formulaLike) continue;
                double d;
                try {
                    d = Double.parseDouble(dose);
                } catch (NumberFormatException ex) {
                    continue;
                }
                if (d <= 0 || d > 60) continue;
                String amount = dose + (unit == null ? "g" : normalizeUnit(unit));
                formulas.put(name, new Formula(name, "", amount, usage, ""));
            }
        }

        String name = diagnosis == null ? "" : firstPhrase(diagnosis);
        String description = diagnosis == null ? "" : "診斷：" + diagnosis;
        return new Draft(name, "", description, visitDate == null ? "" : visitDate,
                clinic == null ? "" : clinic, new ArrayList<>(formulas.values()), List.of());
    }

    private static String findDate(List<String> lines) {
        String fallback = null;
        for (String line : lines) {
            if (DATE_SKIP.matcher(line).find()) continue;
            String d = dateIn(line);
            if (d == null) continue;
            if (DATE_HINT.matcher(line).find()) return d;
            if (fallback == null) fallback = d;
        }
        return fallback;
    }

    private static String dateIn(String line) {
        Matcher m = DATE.matcher(line);
        while (m.find()) {
            String d = toIso(m.group(1), m.group(2), m.group(3));
            if (d != null) return d;
        }
        m = COMPACT_DATE.matcher(line);
        while (m.find()) {
            String d = toIso(m.group(1), m.group(2), m.group(3));
            if (d != null) return d;
        }
        return null;
    }

    private static String toIso(String y, String mo, String da) {
        try {
            int year = Integer.parseInt(y);
            if (year < 200) year += 1911;           // 民國年
            else if (year < 1900) return null;
            if (year > 2100) return null;
            return LocalDate.of(year, Integer.parseInt(mo), Integer.parseInt(da)).toString();
        } catch (NumberFormatException | DateTimeException ex) {
            return null;
        }
    }

    private static String findClinic(List<String> lines) {
        String clinic = null;
        String doctor = null;
        for (String line : lines) {
            if (clinic == null) {
                Matcher m = CLINIC.matcher(line);
                if (m.find()) clinic = m.group(1);
            }
            if (doctor == null) {
                Matcher m = DOCTOR.matcher(line);
                if (m.find()) {
                    String d = m.group(1) != null ? m.group(1) : m.group(2);
                    if (d != null && !d.matches(".*(中醫|診所|醫院|主治|藥師).*")) doctor = d;
                }
            }
        }
        if (clinic == null && doctor == null) return null;
        if (doctor == null) return clinic;
        return (clinic == null ? "" : clinic + " ") + doctor + "醫師";
    }

    private static String findDiagnosis(List<String> lines) {
        for (String line : lines) {
            Matcher m = DIAGNOSIS.matcher(line);
            if (m.find()) {
                String d = m.group(1).strip();
                if (!d.isEmpty()) return d.length() > 120 ? d.substring(0, 120) : d;
            }
        }
        return null;
    }

    private static String findUsage(String text) {
        String flat = text.replace('\n', ' ');
        Set<String> parts = new LinkedHashSet<>();
        for (Pattern p : USAGE) {
            Matcher m = p.matcher(flat);
            while (m.find()) {
                String s = m.group().replaceAll("\\s+", "");
                if (!s.isEmpty()) parts.add(s);
            }
        }
        return String.join("，", parts);
    }

    /** 去掉方劑名前面可能黏到的編號或欄位字（例如「1.」「藥名」「處方」）。 */
    private static String trimName(String raw) {
        String n = raw.replaceFirst("^(處方|藥名|品名|中藥|科學中藥|藥品)", "");
        if (n.length() < 2 || n.length() > 12) return null;
        if (STOP_WORDS.contains(n) || STOP_CHARS.matcher(n).find()) return null;
        return n;
    }

    private static String normalizeUnit(String u) {
        return switch (u) {
            case "公克", "克", "gm", "G", "g" -> "g";
            default -> u;
        };
    }

    private static String firstPhrase(String s) {
        String p = s.split("[，,、；;。\\s]")[0];
        return p.length() > 20 ? p.substring(0, 20) : p;
    }
}
