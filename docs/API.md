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
| POST   | `/auth/register/driver`       | Registro de conductor (JSON con vencimientos + 4 fotos) |
| POST   | `/auth/login`                 | Inicio de sesión (devuelve JWT)                        |
| POST   | `/auth/password/forgot`       | Solicita código; responde igual aunque el correo no exista |
| POST   | `/auth/password/reset`        | Cambia la contraseña con código temporal de 6 dígitos  |

## Usuario autenticado

| Método | Ruta                     | Rol            | Descripción                          |
|--------|--------------------------|----------------|----------------------------------------|
| GET    | `/users/me`              | Cualquiera     | Perfil propio                          |
| PATCH  | `/users/me/push-token`   | Cualquiera     | Registra el token FCM del dispositivo  |
| DELETE | `/users/me/push-token`   | Cualquiera     | Elimina el token push al cerrar sesión |
| PATCH  | `/users/me/password`     | Cualquiera     | Cambia la contraseña autenticada       |
| PATCH  | `/users/me/emergency-contact` | Cualquiera | Guarda el contacto usado por el botón SOS |
| POST   | `/users/me/sessions/revoke` | Cualquiera   | Invalida todos los JWT y tokens push    |
| DELETE | `/users/me`              | Cualquiera     | Elimina y anonimiza la cuenta si no hay viaje activo |

## Conductor

| Método | Ruta                        | Rol    | Descripción                              |
|--------|-----------------------------|--------|--------------------------------------------|
| GET    | `/drivers/me`                | DRIVER | Perfil de conductor (vehículo, calificación) |
| PATCH  | `/drivers/me/availability`   | DRIVER | Cambia Disponible / No disponible          |
| POST   | `/drivers/me/location`       | DRIVER | Reporta posición actual (cada pocos segundos) |
| PATCH  | `/drivers/me/documents`      | DRIVER | Renueva licencia/SOAT y vuelve el perfil a revisión |
| PATCH  | `/drivers/me/payment-details`| DRIVER | Configura titular y número para cobros directos por Yape |

## Viajes

| Método | Ruta                              | Rol                  | Descripción                                       |
|--------|-----------------------------------|-----------------------|-----------------------------------------------------|
| POST   | `/trips`                          | PASSENGER              | Solicita un viaje (origen, destino, método de pago) |
| GET    | `/trips/{id}`                     | PASSENGER \| DRIVER    | Detalle del viaje (vista según el rol)              |
| GET    | `/trips/{id}/driver-location`     | PASSENGER               | Última posición del conductor asignado              |
| GET    | `/trips/me`                       | PASSENGER \| DRIVER    | Historial paginado propio                           |
| GET    | `/trips/me/active`                | PASSENGER \| DRIVER    | Recupera el viaje activo después de reiniciar       |
| POST   | `/trips/{id}/offers`              | DRIVER                 | Crea o actualiza su oferta de precio                 |
| GET    | `/trips/{id}/offers`               | PASSENGER              | Lista ofertas pendientes ordenadas por precio        |
| POST   | `/trips/{id}/offers/{offerId}/select` | PASSENGER           | Elige la oferta y asigna al conductor                |
| GET    | `/trips/offers/me`                 | DRIVER                 | Lista las ofertas pendientes propias                 |
| DELETE | `/trips/{id}/offers/me`            | DRIVER                 | Retira la oferta pendiente del conductor             |
| POST   | `/trips/{id}/confirm-payment`      | PASSENGER \| DRIVER    | Confirma pago realizado o recibido tras finalizar    |
| POST   | `/trips/{id}/arrived`             | DRIVER                 | Marca que llegó al punto de recogida                |
| POST   | `/trips/{id}/confirm-code`        | DRIVER                 | Ingresa el código dictado por el pasajero            |
| POST   | `/trips/{id}/finish`              | DRIVER                 | Finaliza el viaje al llegar al destino               |
| POST   | `/trips/{id}/cancel`              | PASSENGER \| DRIVER    | Cancela antes de iniciar; exige `reason` (3-255 caracteres) |
| POST   | `/trips/{id}/rating`              | PASSENGER               | Califica al conductor (1-5) tras finalizar           |

## Notificaciones

| Método | Ruta                        | Descripción                          |
|--------|-----------------------------|-----------------------------------------|
| GET    | `/notifications/me`          | Notificaciones propias (paginado)      |
| PATCH  | `/notifications/{id}/read`   | Marca una notificación como leída      |

## Incidentes

| Método | Ruta                    | Rol                 | Descripción                                      |
|--------|-------------------------|---------------------|--------------------------------------------------|
| POST   | `/incidents`            | PASSENGER \| DRIVER | Reporta un incidente de un viaje propio          |
| GET    | `/incidents/me`         | PASSENGER \| DRIVER | Consulta los reportes creados por el usuario     |
| GET    | `/admin/incidents`      | ADMIN               | Lista y filtra incidentes por estado             |
| POST   | `/admin/incidents/{id}` | ADMIN               | Pone en revisión o resuelve con una nota interna |

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
| GET    | `/admin/audit-logs`                | Historial paginado de acciones administrativas |

## Observabilidad

| Método | Ruta                   | Descripción                                       |
|--------|------------------------|---------------------------------------------------|
| GET    | `/actuator/health`     | Estado de aplicación, base de datos y SMTP        |
| GET    | `/actuator/prometheus` | Métricas internas para Prometheus                  |

Todas las respuestas incluyen `X-Request-ID`. La app móvil envía uno por
solicitud para correlacionar errores reportados con los logs del backend.

## Credenciales de administrador iniciales (solo para el primer despliegue)

```
correo:      admin@utqallya.pe
contraseña:  Utqallya#2026
```

**Cámbiala inmediatamente** después del primer despliegue (ver
`V2__seed_reference_data.sql`); está documentada aquí únicamente para poder
arrancar el panel administrativo por primera vez.

El panel administrativo mínimo está disponible en `/admin`. Después del
primer ingreso, usa **Cambiar clave** antes de realizar cualquier otra
operación.
