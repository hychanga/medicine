package com.medicine.api.repository;

import com.medicine.api.model.AcupointCoord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AcupointCoordRepository extends JpaRepository<AcupointCoord, Long> {

    Optional<AcupointCoord> findByPointId(String pointId);
}
