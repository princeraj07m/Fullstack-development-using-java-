package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> home() {
        return ResponseEntity.ok(Map.of(
                "application", "PLACEMENT API",
                "message", "View data: open the /api/* URLs below in browser.",
                "dataEndpoints", List.of(
                        "/api/students",
                        "/api/companies",
                        "/api/jobs",
                        "/api/applications",
                        "/api/admins",
                        "/api/interviews"
                ),
                "dbVerify", "/api/db/verify"
        ));
    }
}
