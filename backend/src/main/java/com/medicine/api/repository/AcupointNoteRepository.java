package com.medicine.api.repository;

import com.medicine.api.model.AcupointNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcupointNoteRepository extends JpaRepository<AcupointNote, Long> {

    Optional<AcupointNote> findByUserIdAndPointId(String userId, String pointId);

    List<AcupointNote> findByUserId(String userId);
}
