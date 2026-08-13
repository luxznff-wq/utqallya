CREATE TABLE password_reset_codes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_password_reset_codes_user_created
    ON password_reset_codes(user_id, created_at DESC);

CREATE INDEX idx_password_reset_codes_expiry
    ON password_reset_codes(expires_at)
    WHERE used_at IS NULL;
