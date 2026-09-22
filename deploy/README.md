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

## Sauvegardes et restauration

`backend/backup.js` sauvegarde la base PostgreSQL et le dossier `uploads/` ; `verify` prouve que la sauvegarde se
restaure. Sans copie **hors du serveur** (voir plus bas), ce n'est pas encore une protection contre la perte du disque.

**Prérequis** : client PostgreSQL au moins aussi récent que le serveur (`apt install postgresql-client`), Node (déjà là).

```bash
# Dossier des sauvegardes : HORS de uploads/ (qui est servi au public), lisible par l'utilisateur de l'app seulement
install -d -m 700 -o <utilisateur-app> /var/backups/handassi

# crontab de l'utilisateur de l'app : sauvegarde chaque nuit, contrôle de restauration chaque dimanche
15 3 * * *  cd /var/www/handassi.dz/backend && BACKUP_DIR=/var/backups/handassi node backup.js run    >> /var/log/handassi-backup.log 2>&1
30 4 * * 0  cd /var/www/handassi.dz/backend && BACKUP_DIR=/var/backups/handassi node backup.js verify >> /var/log/handassi-backup.log 2>&1
```

- **Contenu** : `db/db-AAAAMMJJ-HHMMSS.dump` (14 jours, + une copie mensuelle sur 12 mois) et `uploads/AAAAMMJJ-HHMMSS/`
  (7 instantanés ; les fichiers inchangés sont des liens physiques, donc presque aucun espace en plus, et un fichier
  supprimé par erreur reste récupérable dans un instantané antérieur). Durées : `BACKUP_KEEP_DAYS`,
  `BACKUP_KEEP_MONTHLY`, `BACKUP_KEEP_SNAPSHOTS`.
- **Perte maximale (RPO)** : jusqu'à 24 h de commandes avec une sauvegarde nocturne. Pour moins, planifier aussi
  `BACKUP_UPLOADS=false node backup.js run` toutes les 4-6 h (base seule, très léger).
- **`verify`** restaure le dernier dump dans une base temporaire (supprimée ensuite), compare les effectifs des tables
  clés à la base réelle, et recompare un échantillon de fichiers par empreinte SHA-256. `--strict` exige l'égalité
  exacte (juste après une sauvegarde). Une table vide dans la sauvegarde alors que la base contient des lignes est une
  alerte ; sur un site tout neuf, une fausse alerte est possible la première semaine (relancer `verify`). L'utilisateur
  de la base doit pouvoir créer une base : `setup.sh` le prévoit désormais (`CREATEDB`) ; sur un serveur déjà installé,
  `sudo -u postgres psql -c "ALTER ROLE handassi CREATEDB;"`. Testé avec un rôle non-superutilisateur, propriétaire de
  sa base, comme celui de `setup.sh` (migrations depuis zéro, sauvegarde et restauration).
- **Alerte si la sauvegarde ne tourne plus** : créer deux contrôles gratuits sur healthchecks.io et renseigner
  `HEALTHCHECK_URL` (pingée après chaque `run` réussi, `/fail` sinon) et `HEALTHCHECK_URL_VERIFY`. Sans cela, une
  sauvegarde qui échoue en silence ne se voit qu'au jour du sinistre.

### Restaurer après un sinistre

```bash
# 1. Base : créer une base vide, puis restaurer le dump voulu (le plus récent : db/db-….dump)
createdb -h <hote> -U <utilisateur> handassi_db
pg_restore --no-owner --no-privileges -h <hote> -U <utilisateur> -d handassi_db /var/backups/handassi/db/db-AAAAMMJJ-HHMMSS.dump
cd /var/www/handassi.dz/backend && npm run migrate      # sans effet si déjà à jour, applique les migrations manquantes sinon

# 2. Fichiers : recopier l'instantané voulu (ou un seul fichier supprimé par erreur)
cp -a /var/backups/handassi/uploads/AAAAMMJJ-HHMMSS/. /var/www/handassi.dz/backend/uploads/
```

### Copie hors du serveur (à mettre en place — non fournie)

Le dossier de sauvegarde est sur le même disque que le site : une panne du disque ou du VPS emporte tout. Copier
`/var/backups/handassi` chaque nuit vers un autre fournisseur (stockage objet type Backblaze B2 / Hetzner Storage Box) avec
un outil qui **chiffre côté client** — les sauvegardes contiennent emails et hachages de mots de passe (ex. `restic` ou
`rclone` avec `crypt`). Non testé ici : à essayer avec une restauration réelle depuis la copie.

### Si la production tourne sur Railway

`backup.js` fonctionne contre n'importe quelle `DATABASE_URL` accessible : lancer `run` depuis une machine tierce avec l'URL
**publique** de la base Railway et `BACKUP_UPLOADS=false`. Il ne peut **pas** atteindre le volume `/app/backend/uploads` de
Railway : pour ces fichiers, utiliser la sauvegarde de volumes de Railway (à vérifier selon l'offre) ou, mieux, déplacer les
uploads vers un stockage objet (chantier non fait).

## Surveillance de la disponibilité

`GET /health` interroge aussi la base : **200** `{"status":"ok","db":"ok"}` si tout répond, **503** `{"status":"error","db":"down"}`
sinon (le détail de l'erreur est dans les journaux, jamais dans la réponse). Railway (`healthcheckPath`) et le
`HEALTHCHECK` du `Dockerfile` l'utilisent déjà. Pour être prévenu d'une panne **en dehors** des déploiements, brancher un
moniteur externe sur `https://<domaine>/health` toutes les minutes (UptimeRobot, Better Stack ou healthchecks.io — gratuits)
avec une alerte email/SMS : c'est ce qui manque tant qu'aucun n'est configuré. Ne pas surveiller `/` : la page d'accueil
resterait « verte » base éteinte.

**Suivi d'erreurs (Sentry)** — inactif tant que `SENTRY_DSN` n'est pas défini, aucun compte requis pour faire
tourner le site sans lui. Pour l'activer : créer un projet Node sur [sentry.io](https://sentry.io) (gratuit jusqu'à
5 000 évènements/mois), copier son DSN dans `SENTRY_DSN`. Seules les vraies anomalies sont signalées — une erreur
500 inattendue, une exception qui aurait fait planter le processus — jamais les refus normaux (401/403/404,
validation, contraintes de la base) : voir `backend/src/config/sentry.js`. Aucune donnée de requête (en-têtes, corps,
mots de passe, jetons) n'est envoyée automatiquement, seuls la méthode et le chemin de la requête en échec.

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
