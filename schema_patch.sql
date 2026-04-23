-- ─── Area ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Area (
  Area_ID VARCHAR(36) PRIMARY KEY,
  Name    VARCHAR(100) NOT NULL UNIQUE
);

-- Seed default Areas
INSERT IGNORE INTO Area (Area_ID, Name) VALUES
('area-001', 'Centro'),
('area-002', 'Kabugnayan'),
('area-003', 'Ukay'),
('area-004', 'Molave');
