package com.example.demo.controller;

import com.example.demo.db.DbConnectionVerifier;
import com.example.demo.db.DbConnectionVerifier.VerificationResult;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * REST endpoint to verify MySQL database connection.
 * GET /api/db/verify returns connection status (no auth required).
 */
@RestController
@RequestMapping("/api/db")
public class DbVerifyController {

    private final DbConnectionVerifier dbConnectionVerifier;

    public DbVerifyController(DbConnectionVerifier dbConnectionVerifier) {
        this.dbConnectionVerifier = dbConnectionVerifier;
    }

    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyConnection() {
        VerificationResult result = dbConnectionVerifier.verify();
        return ResponseEntity.ok(Map.of(
                "connected", result.connected(),
                "message", result.message()
        ));
    }
}
