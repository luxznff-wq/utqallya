# API REST — resumen de endpoints

Base URL local: `http://localhost:8080/api`. Documentación interactiva
(Swagger UI) disponible en `/docs` una vez el backend está corriendo.

Todas las respuestas de error siguen el mismo formato (`ApiErrorResponse`):

```json
{
  "timestamp": "2026-07-23T10:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Existen campos inválidos",
  "path": "/api/auth/register/passenger",
  "details": ["email: El correo no tiene un formato válido"]
}
```

## Autenticación — públicos

| Método | Ruta                          | Descripción                                          |
|--------|-------------------------------|-------------------------------------------------------|
| POST   | `/auth/register/passenger`    | Registro de pasajero                                  |
| POST   | `/auth/register/driver`       | Registro de conductor (multipart: JSON + 4 fotos)      |
| POST   | `/auth/login`                 | Inicio de sesión (devuelve JWT)                        |

## Usuario autenticado

| Método | Ruta                     | Rol            | Descripción                          |
|--------|--------------------------|----------------|----------------------------------------|
| GET    | `/users/me`              | Cualquiera     | Perfil propio                          |
| PATCH  | `/users/me/push-token`   | Cualquiera     | Registra el token FCM del dispositivo  |

## Conductor

| Método | Ruta                        | Rol    | Descripción                              |
|--------|-----------------------------|--------|--------------------------------------------|
| GET    | `/drivers/me`                | DRIVER | Perfil de conductor (vehículo, calificación) |
| PATCH  | `/drivers/me/availability`   | DRIVER | Cambia Disponible / No disponible          |
| POST   | `/drivers/me/location`       | DRIVER | Reporta posición actual (cada pocos segundos) |

## Viajes

| Método | Ruta                              | Rol                  | Descripción                                       |
|--------|-----------------------------------|-----------------------|-----------------------------------------------------|
| POST   | `/trips`                          | PASSENGER              | Solicita un viaje (origen, destino, método de pago) |
| GET    | `/trips/{id}`                     | PASSENGER \| DRIVER    | Detalle del viaje (vista según el rol)              |
| GET    | `/trips/{id}/driver-location`     | PASSENGER               | Última posición del conductor asignado              |
| GET    | `/trips/me`                       | PASSENGER \| DRIVER    | Historial paginado propio                           |
| POST   | `/trips/{id}/accept`              | DRIVER                 | Acepta el viaje (gana el primero en llegar)          |
| POST   | `/trips/{id}/arrived`             | DRIVER                 | Marca que llegó al punto de recogida                |
| POST   | `/trips/{id}/confirm-code`        | DRIVER                 | Ingresa el código dictado por el pasajero            |
| POST   | `/trips/{id}/finish`              | DRIVER                 | Finaliza el viaje al llegar al destino               |
| POST   | `/trips/{id}/cancel`              | PASSENGER \| DRIVER    | Cancela el viaje (antes de iniciar)                  |
| POST   | `/trips/{id}/rating`              | PASSENGER               | Califica al conductor (1-5) tras finalizar           |

## Notificaciones

| Método | Ruta                        | Descripción                          |
|--------|-----------------------------|-----------------------------------------|
| GET    | `/notifications/me`          | Notificaciones propias (paginado)      |
| PATCH  | `/notifications/{id}/read`   | Marca una notificación como leída      |

## Panel administrativo (`ROLE_ADMIN` únicamente)

| Método | Ruta                              | Descripción                              |
|--------|-----------------------------------|---------------------------------------------|
| GET    | `/admin/drivers?status=PENDING`   | Lista conductores (filtro opcional por estado) |
| POST   | `/admin/drivers/{id}/approve`      | Aprueba a un conductor                       |
| POST   | `/admin/drivers/{id}/reject`       | Rechaza a un conductor (con motivo)          |
| POST   | `/admin/users/{id}/block`          | Bloquea una cuenta                           |
| POST   | `/admin/users/{id}/unblock`        | Desbloquea una cuenta                        |
| GET    | `/admin/trips`                     | Lista todos los viajes (paginado)            |
| GET    | `/admin/stats`                     | Estadísticas básicas                         |

## Credenciales de administrador iniciales (solo para el primer despliegue)

```
correo:      admin@utqallya.pe
contraseña:  Utqallya#2026
```

**Cámbiala inmediatamente** después del primer despliegue (ver
`V2__seed_reference_data.sql`); está documentada aquí únicamente para poder
arrancar el panel administrativo por primera vez.
