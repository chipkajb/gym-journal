#!/usr/bin/env bash
# prevent-sleep.sh
# Configures a laptop to stay awake with lid closed, keeping WiFi active.
# Designed for use as a home server. Must be run as root.

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
    echo "Error: this script must be run as root (use sudo)." >&2
    exit 1
fi

echo "==> Configuring lid-close behavior via systemd-logind..."

LOGIND_CONF="/etc/systemd/logind.conf"
# Back up original if not already done
if [[ ! -f "${LOGIND_CONF}.bak" ]]; then
    cp "$LOGIND_CONF" "${LOGIND_CONF}.bak"
    echo "    Backed up $LOGIND_CONF to ${LOGIND_CONF}.bak"
fi

# Set all lid-switch actions to ignore (covers battery, AC, and docked states)
declare -A lid_settings=(
    [HandleLidSwitch]=ignore
    [HandleLidSwitchExternalPower]=ignore
    [HandleLidSwitchDocked]=ignore
)

for key in "${!lid_settings[@]}"; do
    val="${lid_settings[$key]}"
    if grep -qE "^#?${key}=" "$LOGIND_CONF"; then
        # Uncomment and set the value
        sed -i -E "s|^#?${key}=.*|${key}=${val}|" "$LOGIND_CONF"
    else
        echo "${key}=${val}" >> "$LOGIND_CONF"
    fi
    echo "    Set ${key}=${val}"
done

echo "==> Restarting systemd-logind to apply changes..."
systemctl restart systemd-logind
echo "    Done."

echo "==> Preventing system sleep/suspend targets..."
systemctl mask \
    sleep.target \
    suspend.target \
    hibernate.target \
    hybrid-sleep.target
echo "    Masked sleep, suspend, hibernate, and hybrid-sleep targets."

echo "==> Disabling WiFi power management to keep networking active..."

# Detect wireless interface names
mapfile -t WIFI_IFACES < <(iw dev 2>/dev/null | awk '/Interface/{print $2}')

if [[ ${#WIFI_IFACES[@]} -eq 0 ]]; then
    echo "    Warning: no wireless interfaces detected. Skipping WiFi power management step."
else
    for iface in "${WIFI_IFACES[@]}"; do
        if command -v iwconfig &>/dev/null; then
            iwconfig "$iface" power off && echo "    Disabled power management on $iface (iwconfig)"
        fi
    done

    # Also disable via NetworkManager if it's running
    if systemctl is-active --quiet NetworkManager; then
        for iface in "${WIFI_IFACES[@]}"; do
            nmcli device set "$iface" autoconnect yes &>/dev/null || true
        done

        # Write a NetworkManager config to persist WiFi power-management=off
        NM_CONF_DIR="/etc/NetworkManager/conf.d"
        mkdir -p "$NM_CONF_DIR"
        cat > "${NM_CONF_DIR}/wifi-powersave-off.conf" <<'EOF'
[connection]
wifi.powersave = 2
EOF
        echo "    Wrote ${NM_CONF_DIR}/wifi-powersave-off.conf (powersave disabled)"
        systemctl reload NetworkManager 2>/dev/null || systemctl restart NetworkManager
        echo "    Reloaded NetworkManager."
    fi
fi

echo ""
echo "==> All done. Your laptop will now:"
echo "    - Stay awake when the lid is closed"
echo "    - Ignore sleep/suspend requests"
echo "    - Keep WiFi active with power management disabled"
echo ""
echo "    To undo these changes, run: sudo bash prevent-sleep.sh --undo"
echo ""

# ── Undo logic ────────────────────────────────────────────────────────────────
if [[ "${1:-}" == "--undo" ]]; then
    echo "==> Reverting changes..."

    if [[ -f "${LOGIND_CONF}.bak" ]]; then
        cp "${LOGIND_CONF}.bak" "$LOGIND_CONF"
        echo "    Restored $LOGIND_CONF from backup."
        systemctl restart systemd-logind
    fi

    systemctl unmask \
        sleep.target \
        suspend.target \
        hibernate.target \
        hybrid-sleep.target
    echo "    Unmasked sleep targets."

    NM_CONF="${NM_CONF_DIR:-/etc/NetworkManager/conf.d}/wifi-powersave-off.conf"
    if [[ -f "$NM_CONF" ]]; then
        rm "$NM_CONF"
        echo "    Removed $NM_CONF."
        systemctl reload NetworkManager 2>/dev/null || true
    fi

    echo "==> Undo complete. Reboot recommended."
    exit 0
fi
