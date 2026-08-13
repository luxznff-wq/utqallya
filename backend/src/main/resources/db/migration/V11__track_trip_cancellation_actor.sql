ALTER TABLE trips
    ADD COLUMN cancelled_by VARCHAR(20);

UPDATE trips
SET cancelled_by = 'SYSTEM'
WHERE status = 'CANCELLED';

ALTER TABLE trips
    ADD CONSTRAINT chk_trips_cancelled_by
        CHECK (
            (status = 'CANCELLED' AND cancelled_by IN ('PASSENGER', 'DRIVER', 'SYSTEM'))
            OR
            (status <> 'CANCELLED' AND cancelled_by IS NULL)
        );
