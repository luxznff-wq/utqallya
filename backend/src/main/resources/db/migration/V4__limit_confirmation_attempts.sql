ALTER TABLE trips
    ADD COLUMN confirmation_attempts INTEGER NOT NULL DEFAULT 0
        CHECK (confirmation_attempts >= 0);
