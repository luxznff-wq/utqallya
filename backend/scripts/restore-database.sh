#!/usr/bin/env bash
set -Eeuo pipefail

compose_file="${COMPOSE_FILE:-docker-compose.prod.yml}"
backup_file="${BACKUP_FILE:-}"

if [[ "${RESTORE_CONFIRM:-}" != "RESTORE_UTQALLYA_DATABASE" ]]; then
  printf 'Restauración cancelada. Define RESTORE_CONFIRM=RESTORE_UTQALLYA_DATABASE.\n' >&2
  exit 1
fi

if [[ -z "$backup_file" || "$backup_file" != /* || ! -f "$backup_file" ]]; then
  printf 'BACKUP_FILE debe ser la ruta absoluta de un archivo existente.\n' >&2
  exit 1
fi

case "$backup_file" in
  *.dump) ;;
  *)
    printf 'BACKUP_FILE debe terminar en .dump.\n' >&2
    exit 1
    ;;
esac

if [[ -f "$backup_file.sha256" ]]; then
  (cd "$(dirname "$backup_file")" && sha256sum --check "$(basename "$backup_file").sha256")
fi

docker run --rm -v "$(dirname "$backup_file"):/backups:ro" postgres:16-alpine \
  pg_restore --list "/backups/$(basename "$backup_file")" >/dev/null

printf 'Se restaurará %s. Escribe RESTAURAR para continuar: ' "$backup_file" >&2
read -r typed_confirmation
if [[ "$typed_confirmation" != "RESTAURAR" ]]; then
  printf 'Restauración cancelada.\n' >&2
  exit 1
fi

docker compose -f "$compose_file" exec -T database \
  pg_restore -U utqallya -d utqallya --clean --if-exists < "$backup_file"

printf 'Restauración completada. Comprueba migraciones, health y flujos críticos.\n'
