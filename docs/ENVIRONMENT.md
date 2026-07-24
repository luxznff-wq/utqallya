# Variables de entorno

## Backend (`backend/`)

Ninguna es estrictamente obligatoria para levantar el backend en local con
los valores por defecto de `application.yml` (excepto la base de datos), pero
**todas son obligatorias en producción**.

| Variable                          | Por defecto (dev)                              | Descripción                                             |
|------------------------------------|-------------------------------------------------|------------------------------------------------------------|
| `DB_URL`                           | `jdbc:postgresql://localhost:5432/utqallya`     | Cadena de conexión a PostgreSQL                            |
| `DB_USERNAME`                      | `utqallya`                                       | Usuario de base de datos                                    |
| `DB_PASSWORD`                      | `utqallya`                                       | Contraseña de base de datos                                 |
| `SERVER_PORT`                      | `8080`                                           | Puerto HTTP del backend                                     |
| `JWT_SECRET`                       | valor de desarrollo (⚠️ cambiar)                 | Clave HMAC para firmar los JWT (mínimo 32 bytes)             |
| `JWT_EXPIRATION_MINUTES`           | `1440` (24h)                                     | Tiempo de vida del token                                     |
| `TRIP_SEARCH_RADIUS_METERS`        | `4000`                                           | Radio de búsqueda de conductores disponibles                 |
| `TRIP_CODE_LENGTH`                 | `4`                                              | Longitud del código de confirmación (4 a 6)                  |
| `TRIP_DRIVER_TIMEOUT_SECONDS`      | `60`                                             | Tiempo antes de cancelar un viaje sin conductor               |
| `TRIP_BASE_FARE`                   | `3.0`                                            | Tarifa base fija (S/), sin tarifas dinámicas                  |
| `TRIP_FARE_PER_KM`                 | `1.5`                                            | Tarifa por km recorrido (S/)                                  |
| `TRIP_AVERAGE_SPEED_KMH`           | `25`                                              | Velocidad promedio asumida para estimar duración              |
| `CLOUDINARY_CLOUD_NAME`            | —                                                 | Cuenta de Cloudinary (fotos de conductores/vehículos)          |
| `CLOUDINARY_API_KEY`               | —                                                 |                                                              |
| `CLOUDINARY_API_SECRET`            | —                                                 |                                                              |
| `FIREBASE_ENABLED`                 | `false`                                          | Activa el envío real de push vía FCM                          |
| `FIREBASE_CREDENTIALS_FILE`        | —                                                 | Ruta al JSON de credenciales de la cuenta de servicio Firebase |
| `CORS_ALLOWED_ORIGINS`             | `http://localhost:19006,http://localhost:8081`   | Orígenes permitidos (app Expo en desarrollo)                  |

Con `FIREBASE_ENABLED=false` el backend sigue funcionando normalmente: las
notificaciones se guardan en base de datos, solo no se envía el push físico.
Esto permite desarrollar sin configurar Firebase.

## Mobile (`mobile/`)

Copiar `mobile/.env.example` a `mobile/.env` y completar:

| Variable                                   | Descripción                                              |
|----------------------------------------------|--------------------------------------------------------------|
| `EXPO_PUBLIC_API_URL`                        | URL base del backend, con `/api` (ej. `http://192.168.1.5:8080/api` para probar en un celular físico) |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID`    | Clave de Google Maps SDK para Android                        |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS`        | Clave de Google Maps SDK para iOS                             |

> En un dispositivo físico, `localhost` apunta al propio celular, no a tu
> computadora: usa la IP de tu red local en `EXPO_PUBLIC_API_URL`.
