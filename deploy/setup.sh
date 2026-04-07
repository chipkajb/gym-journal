#!/usr/bin/env bash
set -euo pipefail

# One-time setup script for gym-journal on a home server.
# Run as root: sudo bash deploy/setup.sh

if [[ $EUID -ne 0 ]]; then
  echo "Error: this script must be run as root (sudo bash deploy/setup.sh)" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Gym Journal Setup ==="
echo "Project directory: $PROJECT_DIR"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v docker &>/dev/null; then
  echo "Error: Docker is not installed. Install it first:" >&2
  echo "  https://docs.docker.com/engine/install/ubuntu/" >&2
  exit 1
fi

if ! docker compose version &>/dev/null; then
  echo "Error: Docker Compose (v2) is not available. Ensure Docker is up to date." >&2
  exit 1
fi

if ! command -v tailscale &>/dev/null; then
  echo "Error: Tailscale is not installed. Install it first:" >&2
  echo "  curl -fsSL https://tailscale.com/install.sh | sh" >&2
  exit 1
fi

if ! command -v openssl &>/dev/null; then
  echo "Error: openssl is not installed. Run: apt-get install -y openssl" >&2
  exit 1
fi

echo "All prerequisites found."
echo ""

# Detect Tailscale IP
echo "Detecting Tailscale IP..."
TAILSCALE_IP="$(tailscale ip -4 2>/dev/null || true)"
if [[ -z "$TAILSCALE_IP" ]]; then
  echo "Warning: Could not detect Tailscale IP. Is Tailscale connected?" >&2
  TAILSCALE_IP="127.0.0.1"
else
  echo "Tailscale IP: $TAILSCALE_IP"
fi
echo ""

# Prompt for NEXTAUTH_SECRET
DEFAULT_SECRET="$(openssl rand -base64 32)"
read -rp "NEXTAUTH_SECRET [auto-generated, press Enter to accept]: " INPUT_SECRET
NEXTAUTH_SECRET="${INPUT_SECRET:-$DEFAULT_SECRET}"

# Prompt for NEXTAUTH_URL
DEFAULT_URL="http://${TAILSCALE_IP}:3000"
read -rp "NEXTAUTH_URL [default: $DEFAULT_URL]: " INPUT_URL
NEXTAUTH_URL="${INPUT_URL:-$DEFAULT_URL}"

# Prompt for POSTGRES_PASSWORD
DEFAULT_PG_PASS="$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32)"
read -rp "POSTGRES_PASSWORD [auto-generated, press Enter to accept]: " INPUT_PG_PASS
POSTGRES_PASSWORD="${INPUT_PG_PASS:-$DEFAULT_PG_PASS}"

# Prompt for ANTHROPIC_API_KEY
echo ""
echo "ANTHROPIC_API_KEY is required for the AI workout name generator."
echo "Get your key at: https://console.anthropic.com/"
read -rp "ANTHROPIC_API_KEY (leave blank to skip): " ANTHROPIC_API_KEY

echo ""

# Write .env file
ENV_FILE="$PROJECT_DIR/.env"
echo "Writing $ENV_FILE ..."
cat > "$ENV_FILE" <<EOF
TAILSCALE_IP=${TAILSCALE_IP}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=${NEXTAUTH_URL}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
NODE_ENV=production
EOF
chmod 600 "$ENV_FILE"
echo "Wrote $ENV_FILE (mode 600)"
echo ""

# Build Docker image
echo "Building Docker image..."
cd "$PROJECT_DIR"
docker compose build
echo ""

# Install to /opt/gym-journal if not already there
INSTALL_DIR="/opt/gym-journal"
if [[ "$PROJECT_DIR" != "$INSTALL_DIR" ]]; then
  echo "Note: for systemd service, deploy to $INSTALL_DIR or update WorkingDirectory in the service file."
fi

# Copy and enable systemd service
SYSTEMD_DIR="/etc/systemd/system"
echo "Installing systemd service..."
cp "$SCRIPT_DIR/gym-journal.service" "$SYSTEMD_DIR/gym-journal.service"
cp "$SCRIPT_DIR/gym-journal-backup.service" "$SYSTEMD_DIR/gym-journal-backup.service"
cp "$SCRIPT_DIR/gym-journal-backup.timer" "$SYSTEMD_DIR/gym-journal-backup.timer"

systemctl daemon-reload
systemctl enable gym-journal.service
echo "Enabled gym-journal.service"

# Enable backup timer
systemctl enable --now gym-journal-backup.timer
echo "Enabled gym-journal-backup.timer"
echo ""

# Start the app
echo "Starting gym-journal..."
systemctl start gym-journal.service
echo ""

echo "=== Setup complete! ==="
echo ""
echo "Gym Journal is running at: $NEXTAUTH_URL"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status gym-journal"
echo "  sudo systemctl restart gym-journal"
echo "  sudo journalctl -u gym-journal -f"
echo "  sudo bash $SCRIPT_DIR/redeploy.sh"
