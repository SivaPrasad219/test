### STAGE 1: Build ###
FROM node:18.16.0-alpine as builder

WORKDIR /ng-app
COPY package*.json ./
RUN npm install --legacy-peer-deps
ENV VUE_APP_TIME_CONFIGURABLE=60
COPY . .
RUN npm run build
RUN ls /ng-app/dist

### STAGE 2: Setup ###
FROM nginx:1.26-alpine

# Install all required networking and VPN packages
RUN apk add --no-cache \
    # Core networking
    openssh-client \
    iproute2 \
    iptables \
    curl \
    netcat-openbsd \
    bind-tools \
    ca-certificates \
    # VPN clients
    openvpn \
    wireguard-tools \
    strongswan \
    xl2tpd \
    ppp \
    # PPP utilities
    ppp-dev \
    # Interactive tools
    dialog \
    bash \
    nano \
    wget \
    # Monitoring
    htop \
    # Logging
    busybox-extras \
    # For enterprise auth
    krb5 \
    nss-pam-ldapd \
    && rm -rf /var/cache/apk/*

# Create all required directories with proper permissions
RUN mkdir -p /etc/openvpn /etc/wireguard /etc/ipsec.d /vpn-configs /vpn-logs \
    /etc/ppp /var/run/xl2tpd /var/log /var/lib/ppp \
    && chmod 755 /vpn-configs /vpn-logs \
    && chmod 1777 /var/run/xl2tpd \
    && chmod 755 /var/log /var/lib/ppp

# Configure StrongSwan for better L2TP support
RUN echo "charon { load_modular = yes }" >> /etc/strongswan.conf && \
    echo "include strongswan.d/charon/*.conf" >> /etc/strongswan.conf

# Copy all VPN scripts
COPY vpn-scripts/vpn-manager.sh /usr/local/bin/vpn-manager
COPY vpn-scripts/openvpn-setup.sh /usr/local/bin/openvpn-setup
COPY vpn-scripts/wireguard-setup.sh /usr/local/bin/wireguard-setup
COPY vpn-scripts/ipsec-setup.sh /usr/local/bin/ipsec-setup
COPY vpn-scripts/connect-ipsec.sh /usr/local/bin/connect-ipsec
COPY vpn-scripts/vpn-status.sh /usr/local/bin/vpn-status
COPY vpn-scripts/vpn-disconnect.sh /usr/local/bin/vpn-disconnect
RUN chmod +x /usr/local/bin/vpn-* /usr/local/bin/connect-ipsec /usr/local/bin/ipsec-setup

# Copy nginx configs and certs
COPY deploy/default.conf /etc/nginx/conf.d/
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY deploy/certs/digitalair.crt /etc/nginx/certs/
COPY deploy/certs/digitalair.key /etc/nginx/certs/

# Remove default nginx website and copy app
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /ng-app/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 vpn && \
    adduser -D -u 1001 -G vpn vpnuser && \
    chown -R vpnuser:vpn /vpn-configs /vpn-logs

EXPOSE 80 443 500/udp 1701/udp 4500/udp 1194/udp 51820/udp

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD curl -sf --head --insecure https://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]