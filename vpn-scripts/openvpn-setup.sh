#!/bin/bash
# Quick OpenVPN interactive setup

echo "=== 🔗 OpenVPN Quick Setup ==="
echo "==============================="

read -p "🌐 VPN Server Address: " server
if [ -z "$server" ]; then
    echo "❌ Server address is required!"
    exit 1
fi

read -p "🔌 VPN Port [1194]: " port
port=${port:-1194}

read -p "📡 Protocol [udp]: " proto
proto=${proto:-udp}

read -p "👤 Username: " username
if [ -z "$username" ]; then
    echo "❌ Username is required!"
    exit 1
fi

read -s -p "🔑 Password: " password
echo
if [ -z "$password" ]; then
    echo "❌ Password is required!"
    exit 1
fi

echo ""
echo "📄 Optional: Certificate files (press Enter to skip each)"
read -p "📛 CA Certificate URL: " ca_url
read -p "📛 Client Certificate URL: " cert_url
read -p "🔐 Client Key URL: " key_url
echo ""

echo "🎯 Creating OpenVPN configuration..."

# Create basic OpenVPN config
cat > /vpn-configs/client.ovpn << EOF
client
dev tun
proto $proto
remote $server $port
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-CBC
auth SHA256
verb 3
auth-user-pass /vpn-configs/auth.txt
log /vpn-logs/openvpn.log

# DNS settings
dhcp-option DNS 8.8.8.8
dhcp-option DNS 8.8.4.4

# Compression
compress lz4-v2

# Keepalive
keepalive 10 60
EOF

# Download certificates if URLs provided
if [ ! -z "$ca_url" ] && [ "$ca_url" != "" ]; then
    echo "📥 Downloading CA certificate..."
    wget -O /vpn-configs/ca.crt "$ca_url" && \
    echo "ca /vpn-configs/ca.crt" >> /vpn-configs/client.ovpn
fi

if [ ! -z "$cert_url" ] && [ "$cert_url" != "" ]; then
    echo "📥 Downloading client certificate..."
    wget -O /vpn-configs/client.crt "$cert_url" && \
    echo "cert /vpn-configs/client.crt" >> /vpn-configs/client.ovpn
fi

if [ ! -z "$key_url" ] && [ "$key_url" != "" ]; then
    echo "📥 Downloading client key..."
    wget -O /vpn-configs/client.key "$key_url" && \
    echo "key /vpn-configs/client.key" >> /vpn-configs/client.ovpn
fi

# Create auth file
echo -e "$username\n$password" > /vpn-configs/auth.txt
chmod 600 /vpn-configs/auth.txt

echo ""
echo "✅ OpenVPN configuration created successfully!"
echo "📁 Config file: /vpn-configs/client.ovpn"
echo "🔐 Auth file: /vpn-configs/auth.txt"
echo ""
echo "🚀 To connect, run:"
echo "   vpn-connect.sh openvpn"
echo ""
echo "📋 To view logs:"
echo "   tail -f /vpn-logs/openvpn.log"