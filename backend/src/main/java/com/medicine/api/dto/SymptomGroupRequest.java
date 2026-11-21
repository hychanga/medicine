package com.medicine.api.dto;

import java.util.List;

public class SymptomGroupRequest {

    private String name;
    private String category;
    private String description;
    /** JSON array string — e.g. [{\"name\":\"桂枝湯\",...}] */
    private String formulas;
    /** JSON array string — e.g. [\"GV14\",\"LI4\"] */
    private String points;
    private String sourceUrl;
    private Integer sortOrder;
    /** "web"（預設）或 "scan"（看診方劑掃描）。 */
    private String sourceType;
    /** yyyy-MM-dd */
    private String visitDate;
    private String clinic;
    private String ocrText;
    /** 掃描圖片的公開網址（來自 /parse-scan）。 */
    private List<String> imageUrls;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getFormulas() { return formulas; }
    public void setFormulas(String formulas) { this.formulas = formulas; }

    public String getPoints() { return points; }
    public void setPoints(String points) { this.points = points; }

    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }

    public String getVisitDate() { return visitDate; }
    public void setVisitDate(String visitDate) { this.visitDate = visitDate; }

    public String getClinic() { return clinic; }
    public void setClinic(String clinic) { this.clinic = clinic; }

    public String getOcrText() { return ocrText; }
    public void setOcrText(String ocrText) { this.ocrText = ocrText; }

    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
}
