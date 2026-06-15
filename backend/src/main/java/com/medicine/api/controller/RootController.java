package com.medicine.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public Map<String, String> root() {
        return Map.of(
                "service", "medicine-api",
                "status", "ok",
                "docs", "/api/medicines"
        );
    }
}
