# Modelo de datos

PostgreSQL. El esquema se versiona con Flyway
(`backend/src/main/resources/db/migration`); nunca se modifica a mano en
producción — cualquier cambio es una nueva migración `V{n}__descripcion.sql`.

## Diagrama entidad-relación

```mermaid
erDiagram
    ROLES ||--o{ USERS : "tiene"
    USERS ||--o| DRIVERS : "es (si role=DRIVER)"
    VEHICLES ||--o| DRIVERS : "asignado a"
    DRIVERS ||--o| DRIVER_LOCATIONS : "reporta"
    USERS ||--o{ TRIPS : "solicita (pasajero)"
    DRIVERS ||--o{ TRIPS : "atiende"
    GEO_LOCATIONS ||--o{ TRIPS : "origen"
    GEO_LOCATIONS ||--o{ TRIPS : "destino"
    PAYMENT_METHODS ||--o{ TRIPS : "método elegido"
    TRIPS ||--o| RATINGS : "calificación"
    USERS ||--o{ NOTIFICATIONS : "recibe"

    ROLES {
        uuid id PK
        varchar name "PASSENGER | DRIVER | ADMIN"
    }
    USERS {
        uuid id PK
        varchar full_name
        varchar email UK
        varchar phone UK
        text password_hash
        uuid role_id FK
        boolean blocked
        varchar push_token
    }
    VEHICLES {
        uuid id PK
        varchar type "CAR | MOTOTAXI"
        varchar plate UK
        varchar brand
        varchar model
        varchar color
        text photo_url
    }
    DRIVERS {
        uuid id PK
        uuid user_id FK
        uuid vehicle_id FK
        varchar dni_number
        text dni_photo_url
        text license_photo_url
        text soat_photo_url
        varchar approval_status "PENDING|APPROVED|REJECTED|BLOCKED"
        varchar availability "AVAILABLE|UNAVAILABLE"
        double rating_average
        int total_ratings
        int total_trips
    }
    DRIVER_LOCATIONS {
        uuid id PK
        uuid driver_id FK UK
        double latitude
        double longitude
        double heading
    }
    GEO_LOCATIONS {
        uuid id PK
        double latitude
        double longitude
        varchar address
    }
    PAYMENT_METHODS {
        uuid id PK
        varchar code "CASH | YAPE"
        varchar display_name
    }
    TRIPS {
        uuid id PK
        uuid passenger_id FK
        uuid driver_id FK "nullable"
        uuid origin_location_id FK
        uuid destination_location_id FK
        uuid payment_method_id FK
        varchar status
        varchar confirmation_code "4-6 dígitos"
        double distance_km
        int estimated_duration_minutes
        double fare
        int search_radius_meters
        bigint version "optimistic locking"
    }
    RATINGS {
        uuid id PK
        uuid trip_id FK UK
        int score "1-5"
        varchar comment
    }
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        varchar type
        varchar title
        varchar body
        uuid related_trip_id
        boolean read
    }
```

## Notas de diseño

- **`roles` y `payment_methods` son tablas de referencia**, no enums puros a
  nivel de base de datos. Esto da integridad referencial real y permite que
  el panel admin, a futuro, gestione estos catálogos sin una migración.
- **`geo_locations` guarda snapshots**, no un catálogo de lugares: el
  pasajero puede tocar cualquier punto del mapa dentro de la zona de
  cobertura, así que no tiene sentido normalizar direcciones.
- **`driver_locations` es 1 fila por conductor** (se sobrescribe en cada
  actualización), no un historial. Solo interesa la posición actual para
  emparejar y mostrar en el mapa; un historial de rutas está fuera del
  alcance del MVP.
- **`trips.version`** habilita bloqueo optimista como defensa adicional,
  aunque la garantía principal contra condiciones de carrera al aceptar un
  viaje es el `UPDATE` condicional descrito en
  [ARCHITECTURE.md](./ARCHITECTURE.md).
- Todas las tablas heredan `created_at`/`updated_at` (auditoría automática
  vía `BaseEntity` + Spring Data JPA Auditing).
