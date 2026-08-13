ALTER TABLE trips
    ADD COLUMN agreed_fare NUMERIC(10,2)
        CHECK (agreed_fare BETWEEN 1.00 AND 9999.99);

CREATE TABLE trip_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id),
    amount NUMERIC(10,2) NOT NULL CHECK (amount BETWEEN 1.00 AND 9999.99),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'SELECTED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_trip_offers_trip_driver UNIQUE (trip_id, driver_id)
);

CREATE INDEX idx_trip_offers_trip_status_amount
    ON trip_offers(trip_id, status, amount, created_at);
