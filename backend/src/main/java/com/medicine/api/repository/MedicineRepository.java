package com.medicine.api.repository;

import com.medicine.api.model.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    @Query("SELECT m FROM Medicine m WHERE "
            + "LOWER(m.name) LIKE LOWER(CONCAT('%', :q, '%')) OR "
            + "LOWER(m.manufacturer) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Medicine> search(@Param("q") String q);
}
