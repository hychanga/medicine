package com.medicine.api.controller;

import com.medicine.api.dto.MedicineRequest;
import com.medicine.api.model.Medicine;
import com.medicine.api.service.MedicineService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/medicines")
public class MedicineController {

    private final MedicineService service;

    public MedicineController(MedicineService service) {
        this.service = service;
    }

    @GetMapping
    public List<Medicine> list(@AuthenticationPrincipal Jwt jwt,
                               @RequestParam(value = "q", required = false) String query) {
        return service.findAll(jwt.getSubject(), query);
    }

    @GetMapping("/{id}")
    public Medicine get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.findById(jwt.getSubject(), id);
    }

    @PostMapping
    public ResponseEntity<Medicine> create(@AuthenticationPrincipal Jwt jwt,
                                           @Valid @RequestBody MedicineRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(jwt.getSubject(), request));
    }

    @PutMapping("/{id}")
    public Medicine update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                           @Valid @RequestBody MedicineRequest request) {
        return service.update(jwt.getSubject(), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        service.delete(jwt.getSubject(), id);
        return ResponseEntity.noContent().build();
    }
}
