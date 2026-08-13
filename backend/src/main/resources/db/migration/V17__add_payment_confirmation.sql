ALTER TABLE trips
    ADD COLUMN passenger_payment_confirmed_at TIMESTAMPTZ,
    ADD COLUMN driver_payment_confirmed_at TIMESTAMPTZ;
