#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${2:-$NC}$1$NC"
}

show_menu() {
    clear
    log "╔══════════════════════════════════════════════════════╗" $BLUE
    log "║                  VPN MANAGER                         ║" $BLUE
    log "╠══════════════════════════════════════════════════════╣" $BLUE
    log "║ 1. 🔗 Connect to OpenVPN Server                      ║" $NC
    log "║ 2. 🔗 Connect to WireGuard Server                    ║" $NC
    log "║ 3. 🔗 Connect to IPSec/L2TP Server (Cisco compat.)   ║" $NC
    log "║ 4. 📊 Show VPN Status                                 ║" $NC
    log "║ 5. ❌ Disconnect VPN                                  ║" $NC
    log "║ 6. 🌐 Test Network Connectivity                      ║" $NC
    log "║ 7. 💾 Save VPN Configuration                         ║" $NC
    log "║ 0. ❌ Exit VPN Manager                                ║" $NC
    log "╚══════════════════════════════════════════════════════╝" $BLUE
    log "" $NC
    log "Current Status: $(vpn_status_check)" $YELLOW
    log "" $NC
    read -p "Select option [0-7]: " choice
}

vpn_status_check() {
    if ip route show | grep -q "ppp0"; then
        echo "🟢 VPN Connected (ppp0 active - IPSec/L2TP)"
    elif ip route show table all | grep -q "tun0"; then
        echo "🟢 VPN Connected (tun0 active - OpenVPN)"
    elif [ -f /tmp/openvpn.pid ] || [ -f /tmp/l2tpd.pid ]; then
        echo "🟡 VPN Starting..."
    else
        echo "🔴 No VPN Connection"
    fi
}

# Option 3: IPSec/L2TP Setup (Fixed)
setup_ipsec() {
    clear
    log "🔗 IPSec/L2TP Server Setup (Cisco Compatible)" $BLUE
    log "===========================================" $BLUE
    
    read -p "Enter VPN Server Address (e.g., 70.59.17.247): " server
    read -p "Enter Local IP (your client IP, e.g., 198.10.1.49): " local_ip
    read -p "Enter IPSec Pre-Shared Key (PSK): " psk
    read -p "Enter Username: " username
    read -s -p "Enter Password: " password
    echo
    
    log "" $NC
    log "Creating IPSec/L2TP configuration..." $YELLOW
    
    # Create IPSec configuration (exact match to working config)
    cat > /etc/ipsec.conf << EOF
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
EOF

    # Create IPSec secrets (exact format from working config)
    echo "$local_ip $server : PSK \"$psk\"" > /etc/ipsec.secrets
    chmod 600 /etc/ipsec.secrets

    # Create xl2tpd configuration (exact match to working config)
    cat > /etc/xl2tpd/xl2tpd.conf << EOF
[lac myvpn]
lns = $server
ppp debug = yes
pppoptfile = /etc/ppp/options.l2tpd.client
length bit = yes
redial = yes
redial timeout = 5
max redials = 5
EOF

    # Create PPP options (exact match to working config)
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
EOF
    chmod 600 /etc/ppp/options.l2tpd.client

    # Create CHAP secrets (exact format from working config)
    cat > /etc/ppp/chap-secrets << EOF
# Secrets for authentication using CHAP
# client	server	secret			IP addresses
$username * $password *
EOF
    chmod 600 /etc/ppp/chap-secrets

    log "✅ IPSec/L2TP configuration created!" $GREEN
    log "Files created:" $YELLOW
    log "  /etc/ipsec.conf" $NC
    log "  /etc/ipsec.secrets" $NC
    log "  /etc/xl2tpd/xl2tpd.conf" $NC
    log "  /etc/ppp/options.l2tpd.client" $NC
    log "  /etc/ppp/chap-secrets" $NC
    
    log "" $NC
    read -p "Do you want to connect now? (y/n): " connect_now
    
    if [[ $connect_now =~ ^[Yy]$ ]]; then
        connect_ipsec
    fi
}

connect_ipsec() {
    log "🔄 Connecting to IPSec/L2TP..." $YELLOW
    
    # Stop any existing connections
    pkill -f xl2tpd 2>/dev/null || true
    ipsec down myvpn 2>/dev/null || true
    sleep 2
    
    # Start IPSec
    log "Starting IPSec..." $NC
    ipsec restart
    sleep 2
    ipsec up myvpn
    
    if [ $? -ne 0 ]; then
        log "❌ IPSec connection failed!" $RED
        return 1
    fi
    
    log "✅ IPSec connected successfully" $GREEN
    
    # Start L2TP
    log "Starting L2TP..." $NC
    xl2tpd -c /etc/xl2tpd/xl2tpd.conf -D &
    L2TPD_PID=$!
    echo $L2TPD_PID > /tmp/l2tpd.pid
    
    # Wait for PPP connection
    log "Waiting for PPP connection..." $NC
    for i in {1..30}; do
        if ip route show | grep -q "ppp0"; then
            log "✅ L2TP/PPP connection established!" $GREEN
            log "VPN Interface: ppp0" $YELLOW
            log "IPSec Status:" $NC
            ipsec status | grep myvpn
            log "Routing:" $NC
            ip route show | grep ppp0 -A 5
            return 0
        fi
        sleep 2
    done
    
    log "❌ L2TP connection timeout!" $RED
    kill $L2TPD_PID 2>/dev/null || true
    rm -f /tmp/l2tpd.pid
    return 1
}

# Updated disconnect_vpn to handle IPSec/L2TP properly
disconnect_vpn() {
    log "❌ Disconnecting VPN..." $YELLOW
    
    # Stop OpenVPN
    if [ -f /tmp/openvpn.pid ]; then
        kill $(cat /tmp/openvpn.pid) 2>/dev/null || true
        rm -f /tmp/openvpn.pid
        log "OpenVPN stopped" $GREEN
    fi
    
    # Stop WireGuard
    wg-quick down wg0 2>/dev/null || true
    ip link delete wg0 2>/dev/null || true
    log "WireGuard stopped" $GREEN
    
    # Stop IPSec/L2TP (proper cleanup)
    if [ -f /tmp/l2tpd.pid ]; then
        kill $(cat /tmp/l2tpd.pid) 2>/dev/null || true
        rm -f /tmp/l2tpd.pid
        log "L2TP stopped" $GREEN
    fi
    
    # Stop PPP interface
    if ip route show | grep -q "ppp0"; then
        pkill -f pppd 2>/dev/null || true
        sleep 2
        ip link delete ppp0 2>/dev/null || true
        log "PPP interface stopped" $GREEN
    fi
    
    # Stop IPSec
    ipsec down myvpn 2>/dev/null || true
    log "IPSec stopped" $GREEN
    
    log "✅ All VPN connections disconnected" $GREEN
    read -p "Press Enter to continue..."
}

# Updated status check
show_status() {
    clear
    log "📊 VPN Status" $BLUE
    log "============" $BLUE
    
    log "IPSec Status:" $YELLOW
    ipsec status 2>/dev/null | grep -E "(myvpn|INSTALLED)" || log "  No IPSec connections" $RED
    
    log "" $NC
    log "PPP Interface:" $YELLOW
    if ip addr show ppp0 2>/dev/null | grep -q "inet"; then
        ip addr show ppp0 | grep inet
        log "  PPP0: Active" $GREEN
    else
        log "  PPP0: Not connected" $RED
    fi
    
    log "" $NC
    log "Routing Table:" $YELLOW
    ip route show | grep -E "(default|ppp0)" || log "  No VPN routes" $RED
    
    log "" $NC
    log "DNS Resolution:" $YELLOW
    nslookup google.com 2>/dev/null | head -5 || log "DNS test failed" $RED
    
    log "" $NC
    log "External IP (via VPN):" $YELLOW
    curl -s --connect-timeout 5 https://api.ipify.org || log "  Cannot reach IP service" $RED
    
    read -p "Press Enter to continue..."
}

# Main loop (keep existing options 1, 2, 4-7 unchanged, only update option 3)
main() {
    while true; do
        show_menu
        
        case $choice in
            1) setup_openvpn ;;
            2) setup_wireguard ;;
            3) setup_ipsec ;;
            4) show_status ;;
            5) disconnect_vpn ;;
            6) test_connectivity ;;
            7) save_config ;;
            0) 
                log "👋 Goodbye!" $GREEN
                disconnect_vpn
                exit 0
                ;;
            *) log "Invalid option, please try again" $RED ;;
        esac
    done
}

# Include other functions (setup_openvpn, setup_wireguard, etc.) from previous version
# ... (keep the rest of the functions unchanged)

# Trap to clean up on exit
trap 'disconnect_vpn; exit' INT TERM

# Start the manager
main