-- ============================================================================
-- Utqallya - Esquema inicial
-- Transporte de pasajeros para Acarí y Bella Unión (Caravelí, Arequipa)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- roles
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(20) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- users (pasajeros, conductores y administrador comparten esta tabla base)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(120) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    phone           VARCHAR(20)  NOT NULL UNIQUE,
    password_hash   TEXT         NOT NULL,
    role_id         UUID         NOT NULL REFERENCES roles(id),
    blocked         BOOLEAN      NOT NULL DEFAULT FALSE,
    push_token      VARCHAR(255),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_role ON users(role_id);

-- ----------------------------------------------------------------------------
-- vehicles
-- ----------------------------------------------------------------------------
CREATE TABLE vehicles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type        VARCHAR(20) NOT NULL CHECK (type IN ('CAR', 'MOTOTAXI')),
    plate       VARCHAR(10) NOT NULL UNIQUE,
    brand       VARCHAR(60),
    model       VARCHAR(60),
    color       VARCHAR(30),
    photo_url   TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- drivers (perfil extendido de un user con rol DRIVER)
-- ----------------------------------------------------------------------------
CREATE TABLE drivers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id          UUID UNIQUE REFERENCES vehicles(id),
    dni_number          VARCHAR(20) NOT NULL,
    dni_photo_url       TEXT NOT NULL,
    license_photo_url   TEXT NOT NULL,
    soat_photo_url      TEXT NOT NULL,
    approval_status     VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                            CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED', 'BLOCKED')),
    availability        VARCHAR(20) NOT NULL DEFAULT 'UNAVAILABLE'
                            CHECK (availability IN ('AVAILABLE', 'UNAVAILABLE')),
    rating_average      DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_ratings       INTEGER NOT NULL DEFAULT 0,
    total_trips         INTEGER NOT NULL DEFAULT 0,
    rejection_reason    VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_drivers_approval_availability ON drivers(approval_status, availability);

-- ----------------------------------------------------------------------------
-- driver_locations (última posición conocida, se sobrescribe)
-- ----------------------------------------------------------------------------
CREATE TABLE driver_locations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id   UUID NOT NULL UNIQUE REFERENCES drivers(id) ON DELETE CASCADE,
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    heading     DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- geo_locations (snapshots de origen/destino de un viaje)
-- ----------------------------------------------------------------------------
CREATE TABLE geo_locations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    address     VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- payment_methods (catálogo: efectivo, Yape)
-- ----------------------------------------------------------------------------
CREATE TABLE payment_methods (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code          VARCHAR(20) NOT NULL UNIQUE CHECK (code IN ('CASH', 'YAPE')),
    display_name  VARCHAR(40) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- trips
-- ----------------------------------------------------------------------------
CREATE TABLE trips (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passenger_id                UUID NOT NULL REFERENCES users(id),
    driver_id                   UUID REFERENCES drivers(id),
    origin_location_id          UUID NOT NULL REFERENCES geo_locations(id),
    destination_location_id     UUID NOT NULL REFERENCES geo_locations(id),
    payment_method_id           UUID NOT NULL REFERENCES payment_methods(id),
    status                      VARCHAR(25) NOT NULL DEFAULT 'REQUESTED'
                                    CHECK (status IN (
                                        'REQUESTED','SEARCHING_DRIVER','ACCEPTED','DRIVER_ARRIVING',
                                        'WAITING_CONFIRMATION','IN_PROGRESS','FINISHED','RATED','CANCELLED'
                                    )),
    confirmation_code           VARCHAR(6) NOT NULL,
    distance_km                 DOUBLE PRECISION NOT NULL,
    estimated_duration_minutes  INTEGER NOT NULL,
    fare                        DOUBLE PRECISION NOT NULL,
    search_radius_meters        INTEGER NOT NULL,
    accepted_at                 TIMESTAMPTZ,
    driver_arrived_at           TIMESTAMPTZ,
    started_at                  TIMESTAMPTZ,
    finished_at                 TIMESTAMPTZ,
    cancelled_at                TIMESTAMPTZ,
    cancel_reason               VARCHAR(255),
    version                     BIGINT NOT NULL DEFAULT 0,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_trips_passenger ON trips(passenger_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_status ON trips(status);

-- ----------------------------------------------------------------------------
-- ratings (1 a 1 con trips)
-- ----------------------------------------------------------------------------
CREATE TABLE ratings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id     UUID NOT NULL UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
    score       INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment     VARCHAR(300),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- notifications
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type              VARCHAR(30) NOT NULL,
    title             VARCHAR(120) NOT NULL,
    body              VARCHAR(300) NOT NULL,
    related_trip_id   UUID,
    read              BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
