#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/gym-journal"
RETENTION_DAYS="${BACKUP_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/gym-journal_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

# Get postgres container name
CONTAINER="gymjournal-postgres"

echo "Starting backup of gym-journal database..."
docker exec "$CONTAINER" pg_dump -U gymjournal gymjournal | gzip > "$BACKUP_FILE"

echo "Backup saved to: $BACKUP_FILE"
echo "Size: $(du -sh "$BACKUP_FILE" | cut -f1)"

# Rotate old backups
echo "Removing backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "gym-journal_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "Backup complete."
