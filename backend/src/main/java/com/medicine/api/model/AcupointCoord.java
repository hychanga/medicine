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

/**
 * Global calibrated position of an acupuncture point on the body figure, in the
 * atlas' 0-400 x 0-600 coordinate space. Shared by all users (the canonical
 * "where the point sits on the figure"); only an admin may write these. The
 * frontend layers these overrides on top of the static defaults in acupoints.ts.
 */
@Entity
@Table(name = "acupoint_coords",
        uniqueConstraints = @UniqueConstraint(columnNames = {"point_id"}))
public class AcupointCoord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "point_id", nullable = false, length = 32)
    private String pointId;

    // "view" is a reserved word in MySQL/TiDB, so the column is named view_side;
    // the JSON property stays "view" (front | back).
    @Column(name = "view_side", nullable = false, length = 8)
    private String view;

    @Column(nullable = false)
    private int x;

    @Column(nullable = false)
    private int y;

    @Column(name = "updated_by", length = 128)
    private String updatedBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public AcupointCoord() {
    }

    public AcupointCoord(String pointId, String view, int x, int y, String updatedBy) {
        this.pointId = pointId;
        this.view = view;
        this.x = x;
        this.y = y;
        this.updatedBy = updatedBy;
    }

    @PrePersist
    @PreUpdate
    public void touch() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getPointId() {
        return pointId;
    }

    public void setPointId(String pointId) {
        this.pointId = pointId;
    }

    public String getView() {
        return view;
    }

    public void setView(String view) {
        this.view = view;
    }

    public int getX() {
        return x;
    }

    public void setX(int x) {
        this.x = x;
    }

    public int getY() {
        return y;
    }

    public void setY(int y) {
        this.y = y;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
