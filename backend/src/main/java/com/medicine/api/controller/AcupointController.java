package com.medicine.api.controller;

import com.medicine.api.dto.CoordRequest;
import com.medicine.api.model.AcupointCoord;
import com.medicine.api.repository.AcupointCoordRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Global calibrated acupoint coordinates. Anyone signed in can read them (so the
 * atlas shows the calibrated positions); only an admin (app.admin.emails) may
 * write. Coordinates live in the atlas' 0-400 x 0-600 space.
 */
@RestController
@RequestMapping("/api/acupoints")
public class AcupointController {

    private final AcupointCoordRepository repository;
    private final Set<String> adminEmails;

    public AcupointController(AcupointCoordRepository repository,
                             @Value("${app.admin.emails:}") String admins) {
        this.repository = repository;
        this.adminEmails = Arrays.stream(admins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> s.toLowerCase())
                .collect(Collectors.toSet());
    }

    @GetMapping("/coords")
    public List<AcupointCoord> coords() {
        return repository.findAll();
    }

    @PutMapping("/coords/{pointId}")
    public AcupointCoord upsert(@AuthenticationPrincipal Jwt jwt,
                               @PathVariable String pointId,
                               @RequestBody CoordRequest request) {
        String email = jwt.getClaimAsString("email");
        if (email == null || !adminEmails.contains(email.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "僅限管理員校準座標");
        }
        if (!"front".equals(request.getView()) && !"back".equals(request.getView())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "view 必須是 front 或 back");
        }
        int x = Math.max(0, Math.min(400, request.getX()));
        int y = Math.max(0, Math.min(600, request.getY()));

        AcupointCoord coord = repository.findByPointId(pointId).orElseGet(AcupointCoord::new);
        coord.setPointId(pointId);
        coord.setView(request.getView());
        coord.setX(x);
        coord.setY(y);
        coord.setUpdatedBy(email);
        return repository.save(coord);
    }
}
