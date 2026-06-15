package com.medicine.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(name = "acupoint_notes",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "point_id"}))
public class AcupointNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, length = 128)
    private String userId;

    @Column(name = "point_id", nullable = false, length = 32)
    private String pointId;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public AcupointNote() {
    }

    public AcupointNote(String userId, String pointId, String content) {
        this.userId = userId;
        this.pointId = pointId;
        this.content = content;
    }

    @PrePersist
    @PreUpdate
    public void touch() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getPointId() {
        return pointId;
    }

    public void setPointId(String pointId) {
        this.pointId = pointId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
