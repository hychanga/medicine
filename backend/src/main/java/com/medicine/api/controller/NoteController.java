package com.medicine.api.controller;

import com.medicine.api.dto.NoteRequest;
import com.medicine.api.model.AcupointNote;
import com.medicine.api.repository.AcupointNoteRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Per-user personal notes for acupuncture points, persisted in the database.
 * Replaces the original window.storage used by the standalone atlas page.
 */
@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final AcupointNoteRepository repository;

    public NoteController(AcupointNoteRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<AcupointNote> all(@AuthenticationPrincipal Jwt jwt) {
        return repository.findByUserId(jwt.getSubject());
    }

    @GetMapping("/{pointId}")
    public AcupointNote get(@AuthenticationPrincipal Jwt jwt, @PathVariable String pointId) {
        String userId = jwt.getSubject();
        return repository.findByUserIdAndPointId(userId, pointId)
                .orElseGet(() -> new AcupointNote(userId, pointId, ""));
    }

    @PutMapping("/{pointId}")
    public AcupointNote upsert(@AuthenticationPrincipal Jwt jwt, @PathVariable String pointId,
                              @RequestBody NoteRequest request) {
        String userId = jwt.getSubject();
        AcupointNote note = repository.findByUserIdAndPointId(userId, pointId)
                .orElseGet(() -> new AcupointNote(userId, pointId, ""));
        note.setContent(request.getContent());
        return repository.save(note);
    }
}
