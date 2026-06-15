package com.medicine.api.repository;

import com.medicine.api.model.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    List<Medicine> findByUserIdOrderByIdDesc(String userId);

    Optional<Medicine> findByIdAndUserId(Long id, String userId);

    boolean existsByIdAndUserId(Long id, String userId);

    @Query("SELECT m FROM Medicine m WHERE m.userId = :userId AND ("
            + "LOWER(m.name) LIKE LOWER(CONCAT('%', :q, '%')) OR "
            + "LOWER(m.manufacturer) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Medicine> search(@Param("userId") String userId, @Param("q") String q);
}
