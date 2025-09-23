#!/bin/bash
# Enhanced IPSec/L2TP interactive setup
set -e

echo "=== IPSec/L2TP Quick Setup (Cisco Compatible) ==="
echo "================================================"

read -p "Server IP/Address [70.59.17.247]: " server
server=${server:-70.59.17.247}

read -p "Local IP (your client IP) [198.10.1.49]: " local_ip
local_ip=${local_ip:-198.10.1.49}

read -p "Pre-Shared Key (PSK): " psk
read -p "Username [srikanth]: " username
username=${username:-srikanth}
read -s -p "Password: " password
echo

echo "Creating IPSec/L2TP configuration..."

# Create IPSec configuration
cat > /etc/ipsec.conf << EOF
config setup
    charondebug="ike 2, knl 2, cfg 2"
    uniqueids=no

conn myvpn
    auto=add
    keyexchange=ikev1
    authby=secret
    type=transport
    left=%defaultroute
    leftprotoport=17/1701
    rightprotoport=17/1701
    right=$server
    rightid=$server
    ike=aes256-sha256-modp2048,aes128-sha1-modp2048,aes256-sha1-modp1024,aes128-sha1-modp1024
    esp=aes256-sha256,aes128-sha1
    dpddelay=30
    dpdtimeout=120
    dpdaction=clear
EOF

# Create IPSec secrets
echo "# ipsec.secrets - strongSwan IPsec secrets file" > /etc/ipsec.secrets
echo "$local_ip $server : PSK \"$psk\"" >> /etc/ipsec.secrets
chmod 600 /etc/ipsec.secrets

# Create xl2tpd configuration
mkdir -p /var/run/xl2tpd
cat > /etc/xl2tpd/xl2tpd.conf << EOF
[global]
port = 1701

[lac myvpn]
lns = $server
ppp debug = yes
pppoptfile = /etc/ppp/options.l2tpd.client
length bit = yes
redial = yes
redial timeout = 5
max redials = 5
require chap = yes
refuse pap = yes
require authentication = yes
name = $username
randomize nsri = yes
debug network = yes
debug packet = yes
debug state = yes
debug tunnel = yes
EOF

# Create PPP options
cat > /etc/ppp/options.l2tpd.client << EOF
ipcp-accept-local
ipcp-accept-remote
refuse-eap
require-mschap-v2
noccp
noauth
mtu 1410
mru 1410
noipdefault
defaultroute
usepeerdns
debug
connect-delay 5000
lock
noaccomp
asyncmap 0
default-asyncmap
crtscts
modem
name $username
EOF
chmod 600 /etc/ppp/options.l2tpd.client

# Create CHAP secrets
cat > /etc/ppp/chap-secrets << EOF
# Secrets for authentication using CHAP
# client    server    secret            IP addresses
$username    *    $password    *
EOF
chmod 600 /etc/ppp/chap-secrets

echo "✅ Configuration created successfully!"
echo ""
echo "Files created:"
echo "  /etc/ipsec.conf"
echo "  /etc/ipsec.secrets"
echo "  /etc/xl2tpd/xl2tpd.conf"
echo "  /etc/ppp/options.l2tpd.client"
echo "  /etc/ppp/chap-secrets"
echo ""
echo "=== Connection Instructions ==="
echo "1. Run: /usr/local/bin/connect-ipsec"
echo "2. Or manually:"
echo "   ipsec restart"
echo "   ipsec up myvpn"
echo "   sleep 5"
echo "   xl2tpd -c /etc/xl2tpd/xl2tpd.conf -D &"
echo "   sleep 5"
echo "   echo 'c myvpn' > /var/run/xl2tpd/l2tp-control"
echo ""
read -p "Connect now? (y/n): " connect_now

if [[ $connect_now =~ ^[Yy]$ ]]; then
    /usr/local/bin/connect-ipsec
fi