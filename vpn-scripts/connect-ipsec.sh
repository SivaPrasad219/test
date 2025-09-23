#!/bin/bash
# Fixed Connect to IPSec/L2TP VPN with proper kernel modules and tunnel handling
set -e

echo "🔄 Connecting to IPSec/L2TP VPN..."
echo "=================================="

# Check if configurations exist
if [ ! -f /etc/ipsec.conf ]; then
    echo "❌ /etc/ipsec.conf not found. Run /usr/local/bin/ipsec-setup first."
    exit 1
fi

if [ ! -f /etc/xl2tpd/xl2tpd.conf ]; then
    echo "❌ /etc/xl2tpd/xl2tpd.conf not found. Run /usr/local/bin/ipsec-setup first."
    exit 1
fi

# Stop any existing VPN connections
echo "🛑 Stopping existing VPN connections..."
pkill -f xl2tpd 2>/dev/null || true
pkill -f pppd 2>/dev/null || true
ipsec down myvpn 2>/dev/null || true
sleep 3

# Load required kernel modules (if available in container)
echo "🔧 Loading kernel modules..."
modprobe l2tp_ppp 2>/dev/null || echo "Warning: l2tp_ppp module not available (container limitation)"
modprobe pppol2tp 2>/dev/null || echo "Warning: pppol2tp module not available (container limitation)"
modprobe ppp_generic 2>/dev/null || true

# Create xl2tpd control socket directory if missing
mkdir -p /var/run/xl2tpd

# Start IPSec
echo "🔐 Starting IPSec..."
ipsec restart
sleep 3
ipsec up myvpn

if [ $? -ne 0 ]; then
    echo "❌ IPSec connection failed!"
    exit 1
fi

echo "✅ IPSec connected successfully"
echo "IPSec Status:"
ipsec status | grep myvpn

# Wait a bit for IPSec to stabilize
sleep 5

# Start L2TP daemon
echo "🔗 Starting L2TP daemon..."
xl2tpd -c /etc/xl2tpd/xl2tpd.conf -D &
L2TPD_PID=$!
echo $L2TPD_PID > /tmp/l2tpd.pid

# Wait for xl2tpd to initialize
sleep 5

# Connect to the L2TP tunnel using control socket
echo "📡 Connecting to L2TP tunnel..."
echo "c myvpn" > /var/run/xl2tpd/l2tp-control 2>/dev/null || {
    # Fallback method if control socket doesn't exist
    echo "Using fallback connection method..."
    sleep 2
}

# Wait for PPP connection with better debugging
echo "⏳ Waiting for PPP connection (up to 60 seconds)..."
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    # Check for ppp0 interface
    if ip link show ppp0 2>/dev/null > /dev/null 2>&1; then
        echo "✅ PPP interface detected!"
        
        # Wait a bit more for IP assignment
        sleep 5
        
        # Check if we have an IP
        if ip addr show ppp0 | grep -q "inet "; then
            echo "✅ L2TP/PPP connection established with IP!"
            echo "VPN Interface: ppp0"
            echo "IP Address:"
            ip addr show ppp0 | grep inet
            echo ""
            echo "=== VPN Status ==="
            echo "IPSec Status: $(ipsec status | grep myvpn)"
            echo "PPP Interface Status: UP"
            echo "Routing table:"
            ip route show | grep -E "(default|ppp0)" || echo "No VPN routes configured"
            
            # Test connectivity
            echo ""
            echo "🧪 Testing VPN connectivity..."
            ping -c 3 8.8.8.8 > /dev/null 2>&1 && echo "✅ Internet connectivity through VPN: OK" || echo "⚠️  Internet connectivity test failed"
            
            exit 0
        else
            echo "⚠️  PPP interface exists but no IP assigned yet, waiting..."
        fi
    fi
    
    # Check xl2tpd logs for debugging
    if [ $((counter % 10)) -eq 0 ]; then
        echo "L2TP Debug (tail of log):"
        ps aux | grep xl2tpd || echo "xl2tpd process not running"
    fi
    
    sleep 2
    counter=$((counter + 2))
    echo "Waiting... ($counter/$timeout seconds)"
done

echo ""
echo "❌ L2TP connection timeout after $timeout seconds!"
echo ""
echo "=== Troubleshooting ==="
echo "1. Check IPSec status: ipsec status"
echo "2. Check xl2tpd status: ps aux | grep xl2tpd"
echo "3. Check logs: tail -f /var/log/messages (if available)"
echo "4. Verify kernel modules: lsmod | grep l2tp"
echo ""
echo "Manual connection attempt:"
echo "xl2tpd -D -c /etc/xl2tpd/xl2tpd.conf"
echo "echo 'c myvpn' > /var/run/xl2tpd/l2tp-control"

# Cleanup on failure
kill $L2TPD_PID 2>/dev/null || true
rm -f /tmp/l2tpd.pid
exit 1