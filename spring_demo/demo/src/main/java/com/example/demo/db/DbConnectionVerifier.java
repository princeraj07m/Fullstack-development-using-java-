package com.example.demo.db;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Verifies the MySQL database connection by executing a simple query.
 */
@Component
public class DbConnectionVerifier {

    private final JdbcTemplate jdbcTemplate;

    public DbConnectionVerifier(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Attempts to connect to the database and run a simple query.
     *
     * @return VerificationResult with success status and message
     */
    public VerificationResult verify() {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return new VerificationResult(true, "Connection successful. Database is reachable.");
        } catch (Exception e) {
            return new VerificationResult(false,
                    "Connection failed: " + e.getMessage());
        }
    }

    public record VerificationResult(boolean connected, String message) {}
}
