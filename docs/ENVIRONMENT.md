# Variables de entorno

## Backend (`backend/`)

Parte de `backend/.env.example` para producción o de
`backend/.env.staging.example` para staging. Ambos archivos reales están
ignorados por Git; las plantillas contienen solamente marcadores.

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
| `TRIP_DRIVER_TIMEOUT_SECONDS`      | `180`                                            | Tiempo para recibir y elegir ofertas antes de cancelar         |
| `TRIP_AVERAGE_SPEED_KMH`           | `25`                                              | Velocidad promedio asumida para estimar duración              |
| `CLOUDINARY_CLOUD_NAME`            | —                                                 | Cuenta de Cloudinary (fotos de conductores/vehículos)          |
| `CLOUDINARY_API_KEY`               | —                                                 |                                                              |
| `CLOUDINARY_API_SECRET`            | —                                                 |                                                              |
| `FIREBASE_ENABLED`                 | `false`                                          | Activa el envío real de push vía FCM                          |
| `FIREBASE_CREDENTIALS_FILE`        | —                                                 | Ruta al JSON de credenciales de la cuenta de servicio Firebase |
| `CORS_ALLOWED_ORIGINS`             | `http://localhost:19006,http://localhost:8081`   | Orígenes permitidos (app Expo en desarrollo)                  |
| `DIRECTIONS_ENABLED`               | `false`                                          | Activa Google Directions para rutas reales                    |
| `DIRECTIONS_API_KEY`               | —                                                | Clave de servidor restringida para Directions API             |
| `MAIL_ENABLED`                     | `false` (siempre activo en prod)                 | Activa el envío de códigos de recuperación                     |
| `MAIL_HOST`                        | `localhost`                                      | Servidor SMTP; obligatorio en producción                       |
| `MAIL_PORT`                        | `587`                                            | Puerto SMTP                                                    |
| `MAIL_USERNAME`                    | —                                                | Usuario SMTP; obligatorio en producción                        |
| `MAIL_PASSWORD`                    | —                                                | Contraseña SMTP; obligatoria en producción                     |
| `MAIL_FROM`                        | `no-reply@utqallya.pe`                           | Remitente verificado; obligatorio en producción                |
| `MAIL_SMTP_AUTH`                   | `true`                                           | Habilita autenticación SMTP                                    |
| `MAIL_STARTTLS`                    | `true`                                           | Habilita STARTTLS                                              |
| `PASSWORD_RESET_EXPIRATION_MINUTES`| `15`                                             | Vigencia del código de recuperación                            |
| `PASSWORD_RESET_MAX_ATTEMPTS`      | `5`                                              | Intentos antes de invalidar el código                           |
| `SWAGGER_ENABLED`                  | `false` en producción                            | Habilita documentación interactiva solo cuando se requiera    |

Con `FIREBASE_ENABLED=false` el backend sigue funcionando normalmente: las
notificaciones se guardan en base de datos, solo no se envía el push físico.
Esto permite desarrollar sin configurar Firebase.

Con `MAIL_ENABLED=false` el backend local no intenta enviar correos. El perfil
`prod` exige SMTP y activa el envío: usa un remitente verificado y nunca
guardes estas credenciales en Git.

## Mobile (`mobile/`)

Copiar `mobile/.env.example` a `mobile/.env` y completar:

| Variable                                   | Descripción                                              |
|----------------------------------------------|--------------------------------------------------------------|
| `EXPO_PUBLIC_API_URL`                        | URL base del backend, con `/api` (ej. `http://192.168.1.5:8080/api` para probar en un celular físico) |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID`    | Clave de Google Maps SDK para Android                        |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS`        | Clave de Google Maps SDK para iOS                             |
| `EXPO_PUBLIC_EAS_PROJECT_ID`                 | ID del proyecto EAS usado para generar tokens push de Expo    |
| `EXPO_PUBLIC_PRIVACY_URL`                    | URL pública de la política de privacidad                      |
| `EXPO_PUBLIC_TERMS_URL`                      | URL pública de términos y condiciones                         |
| `EXPO_PUBLIC_SUPPORT_URL`                    | URL pública del canal de soporte                              |

> En un dispositivo físico, `localhost` apunta al propio celular, no a tu
> computadora: usa la IP de tu red local en `EXPO_PUBLIC_API_URL`.
