ALTER TABLE drivers
    ADD COLUMN license_expires_at DATE,
    ADD COLUMN soat_expires_at DATE;

CREATE INDEX idx_drivers_document_expiry
    ON drivers(license_expires_at, soat_expires_at);
