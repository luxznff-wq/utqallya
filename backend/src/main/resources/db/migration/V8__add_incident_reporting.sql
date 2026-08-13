CREATE TABLE incidents (
    id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id),
    reporter_id UUID NOT NULL REFERENCES users(id),
    category VARCHAR(30) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    admin_note VARCHAR(1000),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_incidents_trip_reporter UNIQUE (trip_id, reporter_id)
);

CREATE INDEX idx_incidents_status_created ON incidents(status, created_at DESC);
CREATE INDEX idx_incidents_reporter_created ON incidents(reporter_id, created_at DESC);
