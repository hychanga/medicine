package com.medicine.api.dto;

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
}
