ALTER TABLE drivers
    ADD COLUMN yape_holder_name VARCHAR(120),
    ADD COLUMN yape_phone VARCHAR(9);

ALTER TABLE drivers
    ADD CONSTRAINT chk_drivers_yape_complete
        CHECK (
            (yape_holder_name IS NULL AND yape_phone IS NULL)
            OR
            (yape_holder_name IS NOT NULL AND yape_phone ~ '^9[0-9]{8}$')
        );
