# Operación de Utqallya

## Arquitectura mínima de producción

- Un proxy HTTPS (Caddy, Nginx o balanceador administrado).
- Una instancia del backend en perfil `prod`.
- PostgreSQL 16 con volumen persistente y backups externos.
- Cloudinary para documentos.
- Firebase Admin o Expo Push para notificaciones.

El archivo `backend/docker-compose.prod.yml` publica la API únicamente en
`127.0.0.1:8080`; el proxy HTTPS debe ser el único servicio público.

## Preparación

1. Crea un archivo `.env` en `backend/` que nunca se confirme en Git.
2. Copia `.env.example` a `.env` y completa todos los valores requeridos.
3. Usa un `JWT_SECRET` aleatorio de al menos 32 bytes.
4. Valida la configuración antes de construir o desplegar:

```bash
set -a
source .env
set +a
bash ./scripts/validate-production-env.sh
```

## Observabilidad y auditoría

- Recoge `/actuator/prometheus` desde una red interna; no publiques esta ruta
  a Internet mediante el proxy inverso.
- Configura alertas para disponibilidad, respuestas 5xx, latencia, conexiones
  de base de datos, espacio y fallos SMTP.
- Conserva `X-Request-ID` en el proxy y en el agregador de logs.
- Las aprobaciones, rechazos, bloqueos y resoluciones de incidentes quedan en
  `admin_audit_logs` y se consultan desde la pestaña Auditoría del panel.
- Nunca introduzcas contraseñas, JWT, documentos ni credenciales en notas de
  auditoría o logs.
5. Restringe las claves de Google por API, aplicación, dominio o IP.
6. Sustituye inmediatamente la contraseña administrativa inicial.

Si usas Firebase Admin, monta el JSON como archivo de solo lectura dentro del
contenedor y configura `FIREBASE_CREDENTIALS_FILE` con esa ruta. No copies el
JSON dentro de la imagen.

Arranque:

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

Comprobación:

```bash
curl --fail http://127.0.0.1:8080/actuator/health
```

## Backup

El backup debe copiarse a almacenamiento externo cifrado; guardarlo solamente
en el mismo servidor no protege frente a pérdida del servidor.

```bash
BACKUP_DIR=/srv/backups/utqallya bash ./scripts/backup-database.sh
```

El script crea un dump con fecha UTC, valida que PostgreSQL pueda leer su
catálogo y genera un archivo SHA-256. Copia ambos archivos a almacenamiento
externo cifrado. Programa un backup diario, conserva copias semanales y vigila
espacio, antigüedad del último backup y fallos de la tarea.

Restauración controlada:

```bash
BACKUP_FILE=/srv/backups/utqallya/utqallya-AAAAMMDDTHHMMSSZ.dump \
RESTORE_CONFIRM=RESTORE_UTQALLYA_DATABASE \
bash ./scripts/restore-database.sh
```

La restauración reemplaza objetos existentes y solicita una segunda
confirmación interactiva. Ejecútala primero contra una instancia temporal o
staging, nunca como primera prueba en producción. Ensaya el procedimiento antes
del piloto y mensualmente después; registra duración, resultado y responsable.

## Staging

Staging utiliza base de datos, volumen, credenciales y puerto distintos:

```bash
cp .env.staging.example .env.staging
set -a
source .env.staging
set +a
bash ./scripts/validate-production-env.sh
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d --build
curl --fail http://127.0.0.1:8083/actuator/health
```

No reutilices cuentas de servicio ni datos personales de producción. Para una
prueba realista, importa únicamente datos anonimizados. Ejecuta en staging las
migraciones, login, recuperación de contraseña, solicitud y ciclo completo de
viaje, incidentes, panel administrativo y notificaciones antes de promover una
versión.

## Actualización y rollback

1. Genera backup.
2. Construye la nueva imagen.
3. Revisa migraciones Flyway antes de desplegar.
4. Despliega y comprueba `/actuator/health`.
5. Ejecuta una prueba de login, panel y consulta de viaje.

Las migraciones deben ser compatibles hacia adelante. No reviertas una imagen
si la versión anterior no entiende el esquema nuevo; prepara una migración
correctiva.

## Alertas mínimas

- API sin responder o health distinto de `UP`.
- Uso alto de CPU/memoria/disco.
- PostgreSQL sin conexiones o volumen cercano a llenarse.
- Tasa elevada de respuestas 5xx/401/429.
- Fallos de Firebase, Expo Push, Cloudinary o Directions.
- Viajes atascados en estados activos.
