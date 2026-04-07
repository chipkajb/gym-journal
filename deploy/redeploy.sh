#!/usr/bin/env bash
set -euo pipefail

# Quick rebuild and restart script for gym-journal.
# Run as root: sudo bash deploy/redeploy.sh

if [[ $EUID -ne 0 ]]; then
  echo "Error: this script must be run as root (sudo bash deploy/redeploy.sh)" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Gym Journal Redeploy ==="
cd "$PROJECT_DIR"

echo "Building Docker image..."
docker compose build

echo "Restarting gym-journal service..."
systemctl restart gym-journal.service

echo ""
echo "Done. Gym Journal has been redeployed."
echo "Check status with: sudo systemctl status gym-journal"
