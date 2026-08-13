#!/usr/bin/env bash
set -Eeuo pipefail

errors=0

require_value() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    printf 'ERROR: falta %s\n' "$name" >&2
    errors=$((errors + 1))
  fi
}

for name in DB_PASSWORD JWT_SECRET CORS_ALLOWED_ORIGINS MAIL_HOST MAIL_USERNAME MAIL_PASSWORD MAIL_FROM; do
  require_value "$name"
done

if [[ -n "${JWT_SECRET:-}" && ${#JWT_SECRET} -lt 32 ]]; then
  printf 'ERROR: JWT_SECRET debe tener al menos 32 caracteres\n' >&2
  errors=$((errors + 1))
fi

if [[ -n "${CORS_ALLOWED_ORIGINS:-}" && "$CORS_ALLOWED_ORIGINS" != https://* ]]; then
  printf 'ERROR: CORS_ALLOWED_ORIGINS debe comenzar con https://\n' >&2
  errors=$((errors + 1))
fi

if [[ "${FIREBASE_ENABLED:-false}" == "true" ]]; then
  require_value FIREBASE_CREDENTIALS_FILE
fi

if [[ "${DIRECTIONS_ENABLED:-false}" == "true" ]]; then
  require_value DIRECTIONS_API_KEY
fi

cloudinary_count=0
for name in CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET; do
  [[ -n "${!name:-}" ]] && cloudinary_count=$((cloudinary_count + 1))
done
if (( cloudinary_count != 0 && cloudinary_count != 3 )); then
  printf 'ERROR: configura las tres variables CLOUDINARY_* o ninguna\n' >&2
  errors=$((errors + 1))
fi

if (( errors > 0 )); then
  printf 'Validación fallida con %d error(es); no se imprimieron secretos.\n' "$errors" >&2
  exit 1
fi

printf 'Variables de producción válidas (los valores no se muestran).\n'
