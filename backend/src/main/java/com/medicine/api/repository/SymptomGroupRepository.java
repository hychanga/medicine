package com.medicine.api.repository;

import com.medicine.api.model.SymptomGroupEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SymptomGroupRepository extends JpaRepository<SymptomGroupEntity, Long> {
    List<SymptomGroupEntity> findAllByOrderBySortOrderAscCreatedAtAsc();
}
