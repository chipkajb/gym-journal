#!/usr/bin/env bash
# If you changed POSTGRES_PASSWORD in .env but kept the Docker volume, Postgres
# still has the old password — the app crash-loops and port 3001 never listens.
# Run as root after editing .env: sudo bash deploy/sync-postgres-password.sh
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Error: run as root (sudo bash deploy/sync-postgres-password.sh)" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: missing $ENV_FILE" >&2
  exit 1
fi

python3 << PY
import pathlib
import subprocess

path = pathlib.Path("$ENV_FILE")
for line in path.read_text().splitlines():
    if line.startswith("POSTGRES_PASSWORD="):
        pw = line.split("=", 1)[1]
        break
else:
    raise SystemExit("POSTGRES_PASSWORD not found in .env")

esc = pw.replace("'", "''")
sql = f"ALTER USER gymjournal WITH PASSWORD '{esc}';"
subprocess.run(
    [
        "docker",
        "exec",
        "gymjournal-postgres",
        "psql",
        "-U",
        "gymjournal",
        "-d",
        "gymjournal",
        "-h",
        "/var/run/postgresql",
        "-v",
        "ON_ERROR_STOP=1",
        "-c",
        sql,
    ],
    check=True,
)
print("Password synced.")
PY

echo "Restart the app: sudo systemctl restart gym-journal"
