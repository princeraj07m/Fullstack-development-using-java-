-- Spring Security JDBC Authentication: users and authorities tables (MySQL).
-- Run this once in your PLACEMENT database, or enable spring.sql.init to run it on startup.

CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(50) NOT NULL PRIMARY KEY,
    password VARCHAR(500) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS authorities (
    username VARCHAR(50) NOT NULL,
    authority VARCHAR(50) NOT NULL,
    PRIMARY KEY (username, authority),
    CONSTRAINT fk_authorities_users FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- Primary key on (username, authority) already enforces uniqueness
