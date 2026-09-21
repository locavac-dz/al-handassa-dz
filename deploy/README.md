# Déploiement Production — Al Handassa.dz

## Architecture

```
Internet
   │
   ▼ :443 HTTPS
 Nginx  ──────────────── /var/www/handassi.dz/public/   (fichiers statiques frontend)
   │                     (uploads : NON servis par nginx, voir plus bas)
   │ proxy_pass :5000  (/api/, /uploads/, /sitemap.xml, /health)
   ▼
 PM2 (cluster)
   │
   ▼
 Node.js / Express  ───── PostgreSQL (local :5432)
```

---

## Prérequis

| Quoi | Minimum recommandé |
|------|-------------------|
| VPS  | Ubuntu 22.04 LTS |
| RAM  | 2 GB |
| CPU  | 2 vCores |
| SSD  | 40 GB |
| Fournisseurs | DigitalOcean, Hetzner, Contabo, OVH |

---

## Étape 1 — Acheter et configurer le VPS

1. Commander un VPS Ubuntu 22.04
2. Se connecter en SSH :
   ```bash
   ssh root@<IP_VPS>
   ```
3. Pointer le domaine `handassi.dz` vers l'IP du VPS chez ton registrar :
   ```
   A     @          <IP_VPS>
   A     www        <IP_VPS>
   ```

---

## Étape 2 — Setup du serveur (une seule fois)

```bash
# Sur le VPS
curl -O https://raw.githubusercontent.com/.../setup.sh
bash setup.sh
```

Ou en copiant le fichier :
```bash
scp deploy/setup.sh root@<IP_VPS>:/root/
ssh root@<IP_VPS> "bash /root/setup.sh"
```

Ce script installe :
- Node.js 20 LTS
- PM2
- Nginx
- PostgreSQL 16
- Certbot
- UFW (pare-feu)
- fail2ban

**⚠️ Note les identifiants PostgreSQL affichés à la fin** — ils ne seront plus affichés.

---

## Étape 3 — Déployer l'application

### Option A : Depuis ta machine locale (rsync)

```bash
export VPS_HOST=<IP_VPS>
bash deploy/deploy.sh
```

### Option B : Cloner le dépôt Git sur le VPS

```bash
# Sur le VPS
cd /var/www/handassi.dz
git clone https://github.com/ton-user/handassi.dz.git .

# Copier le frontend dans public/
cp -r *.html css/ js/ img/ public/

# Déployer
bash deploy/deploy.sh
```

---

## Étape 4 — SSL Let's Encrypt

> Attends que le DNS se propage (ping handassi.dz doit retourner l'IP du VPS)

```bash
bash deploy/ssl.sh
```

---

## Étape 5 — Configurer les credentials

Éditer le `.env` sur le VPS :
```bash
nano /var/www/handassi.dz/backend/.env
```

Remplir :
- `SMTP_PASS` — mot de passe d'application Gmail
- `SMTP_USER` — ton email Gmail

Puis recharger :
```bash
pm2 reload handassi-api
```

---

## Commandes utiles

```bash
# Voir les logs en temps réel
pm2 logs handassi-api

# Statut des process
pm2 status

# Redémarrer
pm2 restart handassi-api

# Moniteur interactif
pm2 monit

# Recharger Nginx
systemctl reload nginx

# Voir les logs Nginx
tail -f /var/log/nginx/handassi.error.log

# Vérifier le SSL
certbot certificates

# Tester la config Nginx
nginx -t
```

---

## Mises à jour futures

```bash
# Depuis ta machine locale
export VPS_HOST=<IP_VPS>
bash deploy/deploy.sh

# Ou sur le VPS directement
cd /var/www/handassi.dz
git pull
bash deploy/deploy.sh
```

---

## Checklist pré-lancement

- [ ] DNS `handassi.dz` → IP VPS configuré
- [ ] `setup.sh` exécuté sans erreur
- [ ] Application déployée (`pm2 status` → online)
- [ ] SSL actif (`https://handassi.dz` accessible)
- [ ] `.env` complet (SMTP, DB)
- [ ] Test email : `cd backend && node test-email.js`
- [ ] Test API : `curl https://handassi.dz/api/products`
- [ ] Accès admin : `https://handassi.dz/admin/`

---

## Cibles de déploiement (état de l'audit du 21/09/2026)

| Cible | Fichiers | Remarques |
|---|---|---|
| **Railway** (image Docker) | `Dockerfile`, `.dockerignore`, `railway.json` | Une seule image : Express sert l'API **et** le front. Migrations lancées avant chaque déploiement (`preDeployCommand`). Monter un **volume Railway sur `/app/backend/uploads`** (les PDF/vidéos/images ne sont pas dans l'image). |
| **VPS** (nginx + PM2) | `deploy/*.sh`, `deploy/nginx/*` | Copier aussi `security-headers.conf` et `proxy.conf` dans `/etc/nginx/snippets/` (voir l'en-tête de `handassi.dz.conf`). `/uploads/` est **proxifié vers Node** : ne jamais le servir avec `alias`, cela contourne le contrôle d'accès aux fichiers payants. |
| **Vercel** | `vercel.json`, `api/index.js` | Système de fichiers en lecture seule/éphémère : les uploads ne peuvent pas y vivre (prévoir un stockage objet). `sitemap.xml` statique masque la route dynamique : ajouter un rewrite `/sitemap.xml → /api/index`. |

## Variables d'environnement de production

Obligatoires : `NODE_ENV=production`, `DATABASE_URL` (ou `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`),
`JWT_SECRET`, `JWT_REFRESH_SECRET`, `LICENSE_HMAC_SECRET` (générer avec `node backend/generate-secrets.js`, voir
`ROTATION_SECRETS.md`), `FRONTEND_URL` (origine publique du site, ex. `https://handassi.dz`), `TRUST_PROXY=1`.

Selon les fonctionnalités : `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`EMAIL_FROM` (emails, newsletter),
`API_URL` (liens des emails, défaut `FRONTEND_URL`), `SITE_URL` (sitemap, défaut `https://handassi.dz`),
`SATIM_MERCHANT_KEY` (paiement carte), `ANTHROPIC_API_KEY` (assistant), `DB_SSL=strict|false` (voir
`backend/.env.example`), `SMTP_TLS_INSECURE=true` (développement uniquement).

Au démarrage en production, l'API arrête net si `JWT_SECRET` ou la base manquent et journalise `[ENV] ⚠️` pour tout
secret absent, faible ou dupliqué.
