ALTER TABLE trip_offers
    DROP CONSTRAINT trip_offers_status_check;

ALTER TABLE trip_offers
    ADD CONSTRAINT trip_offers_status_check
        CHECK (status IN ('PENDING', 'SELECTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED')),
    ADD COLUMN revision_count INTEGER NOT NULL DEFAULT 1
        CHECK (revision_count BETWEEN 1 AND 5);
