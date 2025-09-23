#!/bin/bash
# Quick VPN status check

echo "=== 📊 VPN Status Dashboard ==="
echo "==============================="

echo ""
echo "🔗 Network Interfaces:"
echo "──────────────────────"

if ip route show table all | grep -q "tun0"; then
    echo "🟢 OpenVPN (tun0): ACTIVE"
    echo "   IP: $(ip addr show tun0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1)"
    echo "   Status: $(cat /sys/class/net/tun0/operstate 2>/dev/null || echo 'unknown')"
else
    echo "🔴 OpenVPN (tun0): INACTIVE"
fi

if command -v wg >/dev/null 2>&1 && wg show wg0 >/dev/null 2>&1; then
    echo "🟢 WireGuard (wg0): ACTIVE"
    echo "   $(wg show wg0 | head -3)"
else
    echo "🔴 WireGuard (wg0): INACTIVE"
fi

echo ""
echo "🌐 External IP & Routing:"
echo "────────────────────────"

if curl -s --connect-timeout 5 https://api.ipify.org >/dev/null 2>&1; then
    EXTERNAL_IP=$(curl -s https://api.ipify.org)
    echo "🌍 External IP: $EXTERNAL_IP"
else
    echo "🌍 External IP: Cannot determine (no internet?)"
fi

echo "📡 Default Route: $(ip route show default | head -1 || echo 'Not configured')"

echo ""
echo "🛠️  Quick Commands:"
echo "───────────────────"
echo "🔄 Connect: vpn-connect.sh [openvpn|wireguard]"
echo "❌ Disconnect: vpn-disconnect.sh"
echo "📋 Logs: tail -f /vpn-logs/openvpn.log"
echo "🔍 Test: network-test.sh"