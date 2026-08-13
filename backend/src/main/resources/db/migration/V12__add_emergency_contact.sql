ALTER TABLE users
    ADD COLUMN emergency_contact_name VARCHAR(120),
    ADD COLUMN emergency_contact_phone VARCHAR(16);

ALTER TABLE users
    ADD CONSTRAINT chk_users_emergency_contact_complete
        CHECK (
            (emergency_contact_name IS NULL AND emergency_contact_phone IS NULL)
            OR
            (emergency_contact_name IS NOT NULL AND emergency_contact_phone IS NOT NULL)
        );
