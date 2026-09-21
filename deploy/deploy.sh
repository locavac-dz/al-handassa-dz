#!/bin/bash
# ══════════════════════════════════════════════════════════════════
#  deploy.sh — Déployer / mettre à jour l'application
#  Usage : bash deploy.sh
#  À lancer depuis la machine locale (rsync vers VPS) OU
#  directement sur le VPS depuis le répertoire du projet cloné.
# ══════════════════════════════════════════════════════════════════
set -e

DOMAIN="handassi.dz"
APP_DIR="/var/www/$DOMAIN"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"   # racine du projet local

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${YELLOW}➡  $1${NC}"; }

# ─── Détection : mode local→VPS ou direct sur VPS ────────────────
if [ -n "$VPS_HOST" ]; then
    # ── MODE RSYNC : depuis ta machine locale ──────────────────────
    info "Synchronisation vers $VPS_HOST…"

    # Frontend (tout sauf backend/, node_modules, .git)
    rsync -avz --progress \
        --exclude='backend/' \
        --exclude='node_modules/' \
        --exclude='.git/' \
        --exclude='deploy/' \
        --exclude='*.log' \
        --exclude='*.md' --exclude='*.py' --exclude='*.sh' --exclude='*.bat' \
        --exclude='package*.json' --exclude='Dockerfile' --exclude='.dockerignore' \
        --exclude='railway.json' --exclude='vercel.json' --exclude='api/' \
        --exclude='uploads/' --exclude='.claude/' --exclude='mobile/' \
        "$LOCAL_DIR/" "root@$VPS_HOST:$APP_DIR/public/"

    # Backend
    rsync -avz --progress \
        --exclude='node_modules/' \
        --exclude='.git/' \
        --exclude='uploads/' \
        --exclude='.env' \
        "$LOCAL_DIR/backend/" "root@$VPS_HOST:$APP_DIR/backend/"

    ok "Fichiers synchronisés"

    # Commandes distantes post-sync
    ssh "root@$VPS_HOST" bash <<'REMOTE'
set -e
cd /var/www/handassi.dz/backend
npm ci --omit=dev
node migrations/run.js
pm2 reload ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production
pm2 save
echo "✅ Application redémarrée"
REMOTE
else
    # ── MODE DIRECT : déjà sur le VPS ──────────────────────────────
    info "Déploiement local (VPS)…"

    # 1. Installer les dépendances Node
    info "Installation des dépendances npm…"
    cd "$APP_DIR/backend"
    npm ci --omit=dev
    ok "npm install terminé"

    # 2. Migrations PostgreSQL
    info "Exécution des migrations SQL…"
    # run.js applique schema.sql une seule fois (base vierge) puis les migrations numérotées, toutes idempotentes.
    # Pas de « || true » : une migration en échec doit arrêter le déploiement (set -e), pas passer inaperçue.
    node migrations/run.js
    ok "Migrations appliquées"

    # 3. PM2 — démarrer ou recharger
    info "Démarrage/rechargement PM2…"
    if pm2 list | grep -q "handassi-api"; then
        pm2 reload ecosystem.config.js --env production
        ok "PM2 rechargé (zero-downtime)"
    else
        pm2 start ecosystem.config.js --env production
        pm2 save
        ok "PM2 démarré"
    fi

    # 4. PM2 au démarrage du serveur
    pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || true

    # 5. Vérification Nginx
    info "Vérification Nginx…"
    nginx -t && systemctl reload nginx
    ok "Nginx rechargé"

    echo ""
    echo "════════════════════════════════════════"
    echo "  ✅ Déploiement terminé !"
    echo "  🌐 https://$DOMAIN"
    echo "════════════════════════════════════════"
fi
