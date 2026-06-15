package com.medicine.api.controller;

import com.medicine.api.dto.NoteRequest;
import com.medicine.api.model.AcupointNote;
import com.medicine.api.repository.AcupointNoteRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Personal notes for acupuncture points, persisted in the database.
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
    public List<AcupointNote> all() {
        return repository.findAll();
    }

    @GetMapping("/{pointId}")
    public AcupointNote get(@PathVariable String pointId) {
        return repository.findByPointId(pointId)
                .orElseGet(() -> new AcupointNote(pointId, ""));
    }

    @PutMapping("/{pointId}")
    public AcupointNote upsert(@PathVariable String pointId, @RequestBody NoteRequest request) {
        AcupointNote note = repository.findByPointId(pointId)
                .orElseGet(() -> new AcupointNote(pointId, ""));
        note.setContent(request.getContent());
        return repository.save(note);
    }
}
