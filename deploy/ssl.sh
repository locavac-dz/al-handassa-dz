#!/bin/bash
# ══════════════════════════════════════════════════════════════════
#  ssl.sh — Obtenir le certificat SSL Let's Encrypt + installer
#            la config Nginx HTTPS finale
#  Usage : bash ssl.sh
#  Prérequis : setup.sh déjà exécuté + DNS handassi.dz → IP VPS
# ══════════════════════════════════════════════════════════════════
set -e

DOMAIN="handassi.dz"
EMAIL="contact@handassi.dz"      # ← adresse pour les alertes d'expiration
NGINX_CONF_SRC="$(dirname "$0")/nginx/handassi.dz.conf"
NGINX_CONF_DEST="/etc/nginx/sites-available/$DOMAIN"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${YELLOW}➡  $1${NC}"; }

# ─── Vérification DNS ────────────────────────────────────────────
info "Vérification DNS de $DOMAIN…"
RESOLVED=$(dig +short $DOMAIN | head -1)
SERVER_IP=$(curl -s https://api.ipify.org)
if [ "$RESOLVED" != "$SERVER_IP" ]; then
    echo -e "${RED}⚠️  DNS non configuré correctement."
    echo "   $DOMAIN pointe vers : ${RESOLVED:-'(rien)'}"
    echo "   IP de ce serveur    : $SERVER_IP"
    echo ""
    echo "   → Configure ton registrar pour pointer $DOMAIN vers $SERVER_IP"
    echo "   → Attends la propagation DNS (jusqu'à 24h) puis relance ce script."
    echo -e "${NC}"
    exit 1
fi
ok "DNS OK — $DOMAIN → $SERVER_IP"

# ─── Obtenir le certificat SSL ───────────────────────────────────
info "Obtention du certificat SSL Let's Encrypt…"
certbot certonly \
    --nginx \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"
ok "Certificat SSL obtenu"

# ─── Installer la config Nginx HTTPS finale ───────────────────────
info "Installation de la config Nginx HTTPS…"
if [ -f "$NGINX_CONF_SRC" ]; then
    cp "$NGINX_CONF_SRC" "$NGINX_CONF_DEST"
    ok "Config copiée depuis deploy/nginx/handassi.dz.conf"
else
    echo "  Fichier source non trouvé, génération inline…"
    # Inline fallback si le fichier conf n'est pas sur le VPS
    cat > "$NGINX_CONF_DEST" <<NGINX
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$DOMAIN\$request_uri; }
}
server {
    listen 443 ssl http2;
    server_name www.$DOMAIN;
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    return 301 https://$DOMAIN\$request_uri;
}
server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    client_max_body_size 210M;
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    root /var/www/$DOMAIN/public;
    index index.html;
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }
    location /uploads/ {
        alias /var/www/$DOMAIN/backend/uploads/;
        expires 7d;
    }
    location / { try_files \$uri \$uri/ \$uri.html /index.html; }
    access_log /var/log/nginx/$DOMAIN.access.log;
    error_log  /var/log/nginx/$DOMAIN.error.log warn;
}
NGINX
fi

# Test et rechargement Nginx
nginx -t && systemctl reload nginx
ok "Nginx rechargé avec HTTPS"

# ─── Renouvellement automatique (cron) ───────────────────────────
info "Configuration du renouvellement automatique SSL…"
(crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * certbot renew --quiet --nginx && systemctl reload nginx") | crontab -
ok "Renouvellement automatique configuré (tous les jours à 3h)"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   ✅  SSL configuré avec succès !                        ║"
echo "║   🌐  https://$DOMAIN                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  Test SSL : curl -I https://$DOMAIN"
echo ""
