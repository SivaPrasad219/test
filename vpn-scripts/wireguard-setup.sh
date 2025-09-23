#!/bin/bash
# Quick WireGuard interactive setup

echo "=== 🔗 WireGuard Quick Setup ==="
echo "================================"

read -p "🌐 VPN Server Address: " server
if [ -z "$server" ]; then
    echo "❌ Server address is required!"
    exit 1
fi

read -p "🔌 VPN Port [51820]: " port
port=${port:-51820}

echo ""
echo "🔑 Key Generation Options:"
echo "  1. Generate new key pair (recommended)"
echo "  2. Use existing private key"
echo ""
read -p "Choose option [1-2]: " key_option
key_option=${key_option:-1}

case $key_option in
    1)
        private_key=$(wg genkey)
        public_key=$(echo "$private_key" | wg pubkey)
        echo "✅ Generated key pair:"
        echo "   Private Key: $private_key"
        echo "   Public Key:  $public_key"
        echo ""
        ;;
    2)
        read -s -p "🔑 Enter your Private Key: " private_key
        echo ""
        if [ -z "$private_key" ]; then
            echo "❌ Private key is required!"
            exit 1
        fi
        public_key=$(echo "$private_key" | wg pubkey)
        echo "✅ Your Public Key: $public_key"
        echo ""
        ;;
    *)
        echo "❌ Invalid option!"
        exit 1
        ;;
esac

read -p "🔐 Server Public Key: " server_pubkey
if [ -z "$server_pubkey" ]; then
    echo "❌ Server public key is required!"
    exit 1
fi

read -p "🌐 Allowed IPs [0.0.0.0/0]: " allowed_ips
allowed_ips=${allowed_ips:-0.0.0.0/0}

read -s -p "🔒 Pre-shared Key [optional]: " psk
echo ""

echo ""
echo "🎯 Creating WireGuard configuration..."

# Stop any existing WireGuard
wg-quick down wg0 2>/dev/null || true
ip link delete wg0 2>/dev/null || true

cat > /vpn-configs/wg0.conf << EOF
[Interface]
PrivateKey = $private_key
Address = 10.0.0.2/24
DNS = 8.8.8.8, 8.8.4.4
MTU = 1420

[Peer]
PublicKey = $server_pubkey
AllowedIPs = $allowed_ips
Endpoint = $server:$port
PersistentKeepalive = 25
EOF

if [ ! -z "$psk" ]; then
    sed -i "/AllowedIPs/a PresharedKey = $psk" /vpn-configs/wg0.conf
fi

chmod 600 /vpn-configs/wg0.conf

echo ""
echo "✅ WireGuard configuration created successfully!"
echo "📁 Config file: /vpn-configs/wg0.conf"
echo "🔐 Private Key: $private_key"
echo ""
echo "🚀 To connect, run:"
echo "   vpn-connect.sh wireguard"
echo ""
echo "📋 To view status:"
echo "   wg show wg0"