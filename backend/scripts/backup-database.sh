#!/usr/bin/env bash
set -Eeuo pipefail

compose_file="${COMPOSE_FILE:-docker-compose.prod.yml}"
backup_dir="${BACKUP_DIR:-}"

if [[ -z "$backup_dir" || "$backup_dir" != /* || "$backup_dir" == "/" ]]; then
  printf 'BACKUP_DIR debe ser una ruta absoluta y no puede ser /.\n' >&2
  exit 1
fi

mkdir -p -- "$backup_dir"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="$backup_dir/utqallya-$timestamp.dump"
backup_complete=false

cleanup_partial_backup() {
  if [[ "$backup_complete" != "true" ]]; then
    rm -f -- "$backup_file" "$backup_file.sha256"
  fi
}
trap cleanup_partial_backup EXIT

docker compose -f "$compose_file" exec -T database \
  pg_dump -U utqallya -d utqallya -Fc > "$backup_file"

if [[ ! -s "$backup_file" ]]; then
  printf 'El backup quedó vacío: %s\n' "$backup_file" >&2
  exit 1
fi

docker run --rm -v "$backup_dir:/backups:ro" postgres:16-alpine \
  pg_restore --list "/backups/$(basename "$backup_file")" >/dev/null

sha256sum "$backup_file" > "$backup_file.sha256"
backup_complete=true
trap - EXIT
printf 'Backup verificado: %s\n' "$backup_file"
