package com.medicine.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "symptom_groups")
public class SymptomGroupEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(length = 64)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** JSON array of Formula objects. */
    @Column(columnDefinition = "TEXT")
    private String formulas;

    /** JSON array of acupoint IDs (strings). */
    @Column(columnDefinition = "TEXT")
    private String points;

    /** 彩光療法：JSON array of {color, points:[穴位代號], method, effect}。 */
    @Column(name = "color_light", columnDefinition = "TEXT")
    private String colorLight;

    @Column(name = "source_url", length = 512)
    private String sourceUrl;

    /** 資料來源："web"（網路整理，預設）或 "scan"（看診方劑掃描）。 */
    @Column(name = "source_type", length = 16)
    private String sourceType;

    /** 掃描圖片的公開 GCS 網址，JSON 字串陣列。 */
    @Column(name = "image_urls", columnDefinition = "TEXT")
    private String imageUrls;

    @Column(name = "visit_date")
    private LocalDate visitDate;

    /** 診所 / 醫師。 */
    @Column(length = 128)
    private String clinic;

    /** 掃描圖片的 OCR 原文（供核對）。 */
    @Column(name = "ocr_text", columnDefinition = "TEXT")
    private String ocrText;

    @Column(name = "created_by", length = 128)
    private String createdBy;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }

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

    public String getColorLight() { return colorLight; }
    public void setColorLight(String colorLight) { this.colorLight = colorLight; }

    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }

    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }

    public String getImageUrls() { return imageUrls; }
    public void setImageUrls(String imageUrls) { this.imageUrls = imageUrls; }

    public LocalDate getVisitDate() { return visitDate; }
    public void setVisitDate(LocalDate visitDate) { this.visitDate = visitDate; }

    public String getClinic() { return clinic; }
    public void setClinic(String clinic) { this.clinic = clinic; }

    public String getOcrText() { return ocrText; }
    public void setOcrText(String ocrText) { this.ocrText = ocrText; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
