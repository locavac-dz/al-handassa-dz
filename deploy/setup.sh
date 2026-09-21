#!/bin/bash
# ══════════════════════════════════════════════════════════════════
#  setup.sh — Installation complète du serveur VPS (Ubuntu 22.04)
#  Usage : bash setup.sh
#  Durée estimée : ~10-15 minutes
# ══════════════════════════════════════════════════════════════════
set -e

DOMAIN="handassi.dz"
APP_DIR="/var/www/$DOMAIN"
DB_NAME="handassi_db"
DB_USER="handassi"
DB_PASS=$(openssl rand -base64 24)   # mot de passe généré automatiquement
NODE_VERSION="20"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${YELLOW}➡  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Al Handassa.dz — Setup serveur production     ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ─── 1. Mise à jour système ───────────────────────────────────────
info "Mise à jour des paquets système…"
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq curl wget git unzip ufw fail2ban
ok "Système à jour"

# ─── 2. Pare-feu UFW ─────────────────────────────────────────────
info "Configuration du pare-feu UFW…"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ok "Pare-feu actif (SSH + HTTP + HTTPS)"

# ─── 3. Node.js 20 LTS ───────────────────────────────────────────
info "Installation de Node.js $NODE_VERSION LTS…"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - > /dev/null
apt-get install -y -qq nodejs
node --version
npm --version
ok "Node.js $(node --version) installé"

# ─── 4. PM2 ──────────────────────────────────────────────────────
info "Installation de PM2…"
npm install -g pm2 --silent
pm2 --version
ok "PM2 $(pm2 --version) installé"

# ─── 5. Nginx ────────────────────────────────────────────────────
info "Installation de Nginx…"
apt-get install -y -qq nginx
systemctl enable nginx
systemctl start nginx
ok "Nginx installé et démarré"

# ─── 6. PostgreSQL 16 ────────────────────────────────────────────
info "Installation de PostgreSQL 16…"
apt-get install -y -qq postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# Créer la base de données et l'utilisateur
info "Création de la base de données PostgreSQL…"
sudo -u postgres psql <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASS';
  END IF;
END \$\$;
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
SQL
ok "PostgreSQL — base '$DB_NAME' créée, user '$DB_USER'"

# ─── 7. Certbot (Let's Encrypt) ──────────────────────────────────
info "Installation de Certbot…"
apt-get install -y -qq certbot python3-certbot-nginx
ok "Certbot installé"

# ─── 8. Répertoires de l'application ─────────────────────────────
info "Création des répertoires…"
mkdir -p $APP_DIR/{public,backend}
mkdir -p /var/log/pm2
mkdir -p /var/www/certbot
chown -R www-data:www-data /var/www
chmod -R 755 /var/www
ok "Répertoires créés"

# ─── 9. Génération du fichier .env production ─────────────────────
info "Génération du fichier .env…"
JWT_SECRET=$(openssl rand -base64 48)
JWT_REFRESH=$(openssl rand -base64 48)

cat > $APP_DIR/backend/.env <<ENV
# ─── SERVER ────────────────────────────────────────
NODE_ENV=production
PORT=5000

# ─── PostgreSQL ─────────────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS

# ─── JWT ────────────────────────────────────────────
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=$JWT_REFRESH
JWT_REFRESH_EXPIRES_IN=30d

# ─── EMAIL (SMTP) — à compléter ──────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ton_email@gmail.com
SMTP_PASS=xxxx_xxxx_xxxx_xxxx
EMAIL_FROM="Al Handassa.dz <ton_email@gmail.com>"

# ─── UPLOAD ──────────────────────────────────────────
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=200
ALLOWED_FILE_TYPES=pdf,mp4,zip,epub

# ─── FRONTEND URL ────────────────────────────────────
FRONTEND_URL=https://$DOMAIN

# ─── RATE LIMITING ───────────────────────────────────
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
ENV
chmod 600 $APP_DIR/backend/.env
ok ".env généré dans $APP_DIR/backend/.env"

# ─── 10. Nginx config (temporaire HTTP pour Certbot) ─────────────
info "Configuration Nginx temporaire (HTTP)…"
cat > /etc/nginx/sites-available/$DOMAIN <<'NGINX'
server {
    listen 80;
    server_name handassi.dz www.handassi.dz;
    root /var/www/handassi.dz/public;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location /api/ { proxy_pass http://127.0.0.1:5000; }
    location / { try_files $uri $uri/ /index.html; }
}
NGINX
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
ok "Nginx configuré (HTTP temporaire)"

# ─── 11. Résumé ──────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║               ✅  Setup terminé !                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  PostgreSQL DB   : $DB_NAME"
echo "  PostgreSQL User : $DB_USER"
echo "  PostgreSQL Pass : (dans $APP_DIR/backend/.env, chmod 600 — non affiché)"
echo ""
echo "  ⚠️  Sauvegarde ces identifiants — ils ne seront plus affichés."
echo ""
echo "  Étapes suivantes :"
echo "  1. Déposer les fichiers avec : bash deploy.sh"
echo "  2. Obtenir le SSL            : bash ssl.sh"
echo ""
