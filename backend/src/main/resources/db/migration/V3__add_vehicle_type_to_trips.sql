-- El pasajero ahora elige el tipo de vehículo (auto o mototaxi) al pedir el
-- viaje; solo se notifica a conductores con ese mismo tipo (ver TripServiceImpl).
ALTER TABLE trips
    ADD COLUMN vehicle_type VARCHAR(20) NOT NULL DEFAULT 'CAR'
        CHECK (vehicle_type IN ('CAR', 'MOTOTAXI'));

ALTER TABLE trips ALTER COLUMN vehicle_type DROP DEFAULT;
