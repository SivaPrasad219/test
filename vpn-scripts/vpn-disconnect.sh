#!/bin/bash
# Disconnect all VPN connections

echo "=== ❌ VPN Disconnect ==="
echo "========================"

DISCONNECTED=false

# Stop OpenVPN
if [ -f /tmp/openvpn.pid ]; then
    echo "🔄 Stopping OpenVPN..."
    kill $(cat /tmp/openvpn.pid) 2>/dev/null || true
    rm -f /tmp/openvpn.pid
    sleep 2
    if ! ip route show table all | grep -q "tun0"; then
        echo "✅ OpenVPN disconnected"
        DISCONNECTED=true
    fi
fi

# Stop WireGuard
if command -v wg-quick >/dev/null 2>&1; then
    echo "🔄 Stopping WireGuard..."
    wg-quick down wg0 2>/dev/null || true
    ip link delete wg0 2>/dev/null || true
    sleep 2
    if ! (command -v wg >/dev/null 2>&1 && wg show wg0 >/dev/null 2>&1); then
        echo "✅ WireGuard disconnected"
        DISCONNECTED=true
    fi
fi

# Clean up routes if needed
if ip route show | grep -q "tun0"; then
    echo "🔄 Cleaning up routes..."
    ip route flush table main 2>/dev/null | grep -v "RTNETLINK" || true
fi

if [ "$DISCONNECTED" = true ]; then
    echo ""
    echo "🎉 All VPN connections disconnected successfully!"
    echo "🌐 Network restored to normal operation"
else
    echo ""
    echo "ℹ️  No active VPN connections found"
fi

echo ""
echo "🔍 Verify status: vpn-status.sh"