package com.medicine.api.repository;

import com.medicine.api.model.WellnessResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WellnessResourceRepository extends JpaRepository<WellnessResource, Long> {

    List<WellnessResource> findAllByOrderByCreatedAtDesc();

    // Free-text search over title, summary, tags and category.
    @Query("SELECT w FROM WellnessResource w WHERE "
            + "LOWER(w.title) LIKE LOWER(CONCAT('%', :q, '%')) OR "
            + "LOWER(w.summary) LIKE LOWER(CONCAT('%', :q, '%')) OR "
            + "LOWER(w.tags) LIKE LOWER(CONCAT('%', :q, '%')) OR "
            + "LOWER(w.category) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "ORDER BY w.createdAt DESC")
    List<WellnessResource> search(@Param("q") String q);
}
