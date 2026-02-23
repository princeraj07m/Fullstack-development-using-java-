-- Default users for JDBC authentication (password = "password").
-- BCrypt hash for "password": $2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW
-- Uses INSERT IGNORE so safe to run on every startup.

INSERT IGNORE INTO users (username, password, enabled) VALUES
('user', '{bcrypt}$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', TRUE),
('admin', '{bcrypt}$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', TRUE);

INSERT IGNORE INTO authorities (username, authority) VALUES
('user', 'ROLE_USER'),
('admin', 'ROLE_USER'),
('admin', 'ROLE_ADMIN');
