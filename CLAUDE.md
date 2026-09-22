# genie-civil-dz — Plateforme AL HANDASSA (site public + e-commerce)

Site public d'AL HANDASSA : annuaire d'entreprises, appels d'offres, recrutement, catalogue de logiciels et boutique en ligne (ouvrages et ressources techniques).

## Stack

- Frontend statique multi-pages (HTML/CSS/JS vanilla) à la racine
- Backend Express 4 dans `backend/`
- PWA : `manifest.json` + `sw.js`
- Déploiement : Vercel (`vercel.json`) et Railway (`railway.json`, `Dockerfile`)
- Scripts utilitaires Python à la racine (`minify.py`, `gen_thumbnails*.py`)

## Structure

- `*.html` — pages publiques (annuaire, appels-offres, entreprises, recrutement, logiciels, panier, checkout, compte…)
- `backend/` — API Express
- `admin/`, `api/`, `assets/`, `css/`, `js/`, `img/` — ressources front
- `mobile/` — version mobile
- `deploy/`, `setup-production.sh` — mise en production
- `uploads/` — fichiers déposés (ne pas committer)

## Commandes

```bash
node frontend-server.js   # sert le front en local
cd backend && npm install && npm start
./setup-production.sh
cd backend && npm test    # tests d'intégration (base PostgreSQL de test : voir backend/tests/README.md)
```

Windows : `Lancer_AlHandassa.bat`.

## Points sensibles

- **Paiement SATIM** (`backend/src/config/satim-live.js`) : intégration réelle prévue, signature HMAC-SHA256. `satimCallback()` (`paymentController.js`) vérifie désormais cette signature via `SATIMLive.verifyPaymentConfirmation()` avant de valider un paiement — ne jamais retirer cette vérification. `initiateSatim()` simule encore la réponse SATIM au lieu d'appeler l'API réelle ("Pour la démo, on simule la réponse") : tant que ce n'est pas branché, le paiement carte via cet endpoint échoue systématiquement (comportement voulu, pas un bug — mieux vaut ça qu'un paiement non vérifié).
- **`submitManualPayment()`** (paiement CCP/BaridiMob déclaré par le client lui-même) enregistre désormais la commande en `processing`/le paiement en `pending` — ça ne débloque plus rien tant qu'un admin n'a pas validé via `PATCH /api/admin/payments/:id/validate`. Ne jamais revenir à une validation automatique sur cette route : c'était une faille de fraude gratuite corrigée après audit.
- **Licences logicielles** (`software_licenses`, `backend/src/routes/licenses.js`, `backend/src/utils/license.js`) : émission de clés pour des produits `type='logiciels'` (ex. BétonLab DG), déclenchée automatiquement à la confirmation de paiement (`satimCallback`, `submitManualPayment` dans `paymentController.js`, et la validation manuelle admin dans `admin.js`). Chaque clé inclut un nonce aléatoire (jamais seulement plan+mois, sinon collision entre deux clients). Le secret `LICENSE_HMAC_SECRET` (`.env`) ne doit jamais être partagé avec le secret client-side embarqué dans l'application vendue — voir le CLAUDE.md du produit concerné.
- **Sécurité** : Helmet, CORS, rate limiting (API / login / paiements / validation de licence) et `express-mongo-sanitize` sont configurés directement dans `backend/src/app.js` (pas de fichier middleware séparé — `securityHeaders.js` existait mais n'était jamais utilisé et a été supprimé). Ne pas affaiblir ces réglages.
- **Emails** (`backend/src/utils/email.js`) : confirmations de commande, paiement reçu/validé/rejeté, licence émise, abonnement activé, via SMTP (`nodemailer`).
- `sitemap.xml` (88 Ko) et `robots.txt` sont maintenus pour le SEO — les régénérer après tout ajout de pages.
- `backend/migrations/run.js` (`npm run migrate`) applique `schema.sql` (une fois, à la création de la base) puis toutes les migrations numérotées dans l'ordre — écrire toute nouvelle migration en idempotent (`IF NOT EXISTS` / `ON CONFLICT DO NOTHING`) pour qu'elle reste sûre à ré-appliquer.

## Invariants ajoutés après l'audit du 21/09/2026

- **Fichiers payants** : `file_url` / `video_url` ne sont **jamais** renvoyés par les API publiques (`has_file` à la place) ; un fichier payant ne se récupère que par `GET /api/products/:id/download` (achat/abonnement) ou, pour une vidéo hébergée, par le lien signé `/api/videos/stream/:token` (`utils/mediaToken.js`, 4 h). `/uploads` passe par `middleware/uploadsGuard.js` : seuls images, `previews/`, `ecotec/` et les fichiers référencés comme `preview_url` (jamais comme `file_url`) sont publics. **Aperçus** (`utils/generatePreview.js`) : produit payant = `PREVIEW_MAX_PAGES` premières pages seulement (défaut 5), produit gratuit = aperçu complet ; les aperçus déjà générés se mettent en conformité avec `node backend/limit-existing-previews.js` (simulation par défaut, `--apply --backup-dir <hors uploads/>`).
- **Front servi par Express** (`backend/src/app.js`) : liste blanche (`isPublicFrontPath`) — pages `*.html` et images à la racine, `manifest.json`, `sw.js`, `robots.txt`, `sitemap*.xml`, dossiers `css/ js/ img/ assets/ admin/`. Ne jamais revenir à `express.static(process.cwd())` (exposait `backend/`, `.git`, `package.json`).
- **Livraison d'une commande payée** : un seul point d'entrée, `settleOrder()` (`utils/fulfillment.js`), appelé par `satimCallback` et `PATCH /api/admin/payments/:id/validate`. Idempotent grâce au verrou `UPDATE orders … WHERE status IN (pending, processing, failed)` ; ne pas dupliquer cette logique ailleurs. Index unique `software_licenses(order_item_id)` (migration 028). Validation/rejet admin : uniquement sur un paiement `pending` (409 sinon). `PATCH /api/orders/admin/:id/status` passe aussi par `settleOrder` pour `paid` (409 depuis annulée/remboursée) et révoque licences + accès vidéo pour `refunded`/`cancelled`.
- **Rate limiting** : `TRUST_PROXY` (nombre de proxys, 1 en production) — sans lui tous les clients partagent une IP. Limiteurs dédiés : connexion (échecs par IP et par email), inscription/mot de passe, paiements, codes prépayés.
- **Front** : l'URL du serveur vient de `js/config.js` (`HDS_SERVER`) — ne plus écrire `http://localhost:5000` en dur. Le panneau admin réellement servi est `admin/index.html` (script inline, `esc()` obligatoire pour toute donnée injectée ; boutons Modifier via le registre `REG`) ; `admin/js/*` et `js/admin.js` ne sont chargés par aucune page.
- **Comptes admin** : `backend/reset-admin-password.js <email> <mot_de_passe>` (aucun secret dans le dépôt, qui est public).
- `/api/affiliate` et `/api/referral` sont volontairement **non montés** (tables absentes, failles de fraude). `analytics.js` / `advancedAnalytics.js` (admin) calculent de vraies données : le chiffre d'affaires = commandes `status = 'paid'` (il n'existe **pas** de colonne `orders.payment_status`).
- **Newsletter** : double opt-in (`is_confirmed`, migration 030) — n'est destinataire de `/api/newsletter/send` qu'un abonné actif **et** confirmé ; un email par abonné avec son lien de désinscription ; les liens des emails visent `API_URL` (sinon `FRONTEND_URL`) + `/api/newsletter/confirm|unsubscribe`.
- **Articles** : les routes publiques lisent `status = 'published'` ; toute écriture de `is_published` doit mettre `status` à jour (fait dans `admin.js`, migration 032).
- **Saisies numériques** : `paginate()` (`utils/helpers.js`, plafond 100) pour toute liste paginée, `parsePrice()` pour tout montant saisi ; la base refuse prix/montants négatifs (CHECK, migration 031) et les avis en double. `errorHandler` transforme uuid/enum invalide, valeur hors limites ou trop longue en 400.
- **Emails** (`utils/email.js`, `routes/contact.js`, `routes/newsletter.js`) : toute valeur saisie ou issue de la base passe par `esc()` avant d'entrer dans le HTML.
- **Page d'accueil** : `index.html` (nouvelle, catalogue/vidéos/articles/tarifs via l'API). L'ancienne SPA de 2 556 lignes est dans l'historique : `git show 44896dc^:index.html`. `downloads.html` télécharge via `GET /api/products/:id/download` avec le jeton.
- Migrations récentes (toutes idempotentes) : 028 licences uniques, 029 dérive de schéma, 030 newsletter, 031 index/CHECK, 032 statut d'articles. Code mort supprimé (services SMS/WhatsApp/chatbot, `emailTemplates.js`, `config/satim.js`) : ne pas le recréer sans l'importer réellement.
- **Avis** : `POST /api/products/:id/reviews` exige une ligne `user_downloads` (achat livré, abonnement ou téléchargement d'un produit gratuit).
- **Sitemap** : `GET /sitemap.xml` est généré depuis la base (`utils/sitemap.js`, domaine `SITE_URL`) ; ne plus servir de `sitemap.xml` statique (il masquerait la route). `robots.txt` exclut les pages privées.
- **CSP** (`app.js`) : pages = scripts/styles inline, gestionnaires `onclick` inline, cdnjs, Google Fonts, iframe same-origin ; `/api/*` = `default-src 'none'`. `'unsafe-inline'` étant nécessaire, la protection XSS repose sur `esc()` — ne pas retirer l'échappement en comptant sur la CSP.
- **Environnement** (`config/env.js`) : en production, `JWT_SECRET` ou base absents = arrêt ; secrets faibles/absents/dupliqués = avertissements `[ENV]`. Base : `DATABASE_URL` (prioritaire) ou `DB_*`, `DB_SSL=strict|false`. SMTP : certificat vérifié (`SMTP_TLS_INSECURE=true` en développement seulement). Rotation : `ROTATION_SECRETS.md`, `node backend/generate-secrets.js`.
- **Déploiement** : Railway = `Dockerfile` + `railway.json` (migrations avant déploiement, volume sur `/app/backend/uploads`) ; VPS = `deploy/` (nginx : `/uploads/` **proxifié vers Node**, jamais `alias`) ; détails et variables dans `deploy/README.md`. `backend/uploads` n'est plus suivi par Git.
- **Tests** (`backend/tests/`, `npm test`) : `node:test` contre une vraie base dont le nom contient « test » (`TEST_DATABASE_URL`, garde-fou dans `helpers.js`) ; emails interceptés. Couvrent paiements/SATIM (dont signature fausse), commandes, paywall, avis, codes prépayés, limiteurs, fichiers servis, recherche/pagination/sitemap, `env.js`. Tout nouveau test doit être vérifié en cassant volontairement le code (contrôle négatif) : c'est ce qui a révélé l'absence de test « signature SATIM fausse ». `app.js` ne se lance pas seul quand `NODE_ENV=test` (les tests l'écoutent eux-mêmes). CI : `.github/workflows/ci.yml` (PostgreSQL vierge → migrations x2 → tests sur Node 20 et 22, + build de l'image Docker) — verte dès le premier passage (2026-09-21) : le `Dockerfile` se construit réellement (PyMuPDF présent, l'application se charge avec les seules dépendances de production, exécution sans root).
- **Sauvegardes** (`backend/backup.js`, procédure dans `deploy/README.md`) : `node backup.js run` (dump `pg_dump` custom relu par `pg_restore --list` + instantané des uploads en liens physiques, rétention 14 j / 12 mois / 7 instantanés) et `node backup.js verify [--strict]` (restaure dans une base temporaire, compare les effectifs, recompare des fichiers par SHA-256). `BACKUP_DIR` doit être absolu et **hors de `uploads/`** (refusé sinon : uploads est servi). Le mot de passe de la base ne passe jamais par la ligne de commande. `verify` exige que le rôle ait `CREATEDB` (`deploy/setup.sh` le donne). Testé (`tests/backup.test.js`, contrôles négatifs faits) avec un rôle non-superutilisateur. **Aucune copie hors serveur n'est fournie** : sans elle, la perte du disque emporte aussi les sauvegardes.
- **nginx** (`deploy/nginx/`) : `.github/workflows/ci.yml` (job `nginx`) installe un vrai nginx, pose les fichiers exactement comme l'indique l'en-tête de `handassi.dz.conf`, génère de faux certificats et lance `nginx -t` à chaque push — plus besoin de nginx en local pour valider la syntaxe. Garde-fou automatique : aucune directive `alias` (contournerait le paywall sur `/uploads/`, voir le commentaire du fichier), `/uploads/` reste proxifié vers Node. Non couvert : le comportement réel une fois démarré (SSL, en-têtes envoyés pour de vrai, cache) — seule la syntaxe et ces deux invariants sont vérifiés.
- **Santé** : `GET /health` fait un `SELECT 1` (503 si la base est en panne ou ne répond pas en `HEALTH_DB_TIMEOUT_MS`, sans détail dans la réponse) ; c'est lui que doivent surveiller Railway, Docker et un moniteur externe. Pool PostgreSQL : attente de connexion `DB_CONNECT_TIMEOUT_MS` (défaut 10 s ; 2 s renvoyait des 500 en pic).
- **Suivi d'erreurs** (`backend/src/config/sentry.js`) : optionnel, inactif tant que `SENTRY_DSN` n'est pas défini (aucun compte requis). Pas d'intégration Express automatique (enverrait en-têtes/corps, donc potentiellement mots de passe/jetons) — uniquement des appels manuels ciblés : `errorHandler.js` (seulement le cas 500, jamais les 4xx normaux), `uncaughtException`/`unhandledRejection` (`app.js`, avec `flush()` avant `process.exit` sinon l'envoi est coupé). Procédure d'activation dans `deploy/README.md`.
- **Connu et non traité** : aucun moniteur de disponibilité branché (`/health` prêt, voir `deploy/README.md`) — compte externe requis ; copie hors serveur (chiffrée) des sauvegardes, non mise en place ; sauvegarde du volume d'uploads Railway (`backup.js` ne l'atteint pas) ; mot de passe admin de production à changer et secrets à faire tourner (dépôt public, ancien mot de passe dans l'historique — `ROTATION_SECRETS.md`) ; le `Dockerfile` se construit en CI mais n'a pas encore tourné avec une vraie base, ni sur Railway ; connexion à la base en production sans vérification du certificat par défaut (`DB_SSL=strict` pour l'activer) ; migration des `onclick` inline vers `addEventListener` (pour retrouver `script-src-attr 'none'`) ; `adm-zip` et `uuid` (via exceljs) signalés par `npm audit` mais non atteignables ; `ecotec/` (aperçu du produit gratuit Ecotec) n'est plus dans Git : à fournir sur le volume d'uploads ; sur Vercel, `sitemap.xml` statique et uploads éphémères.

## Consignes

- `.env`, `node_modules/` et `*.log` sont ignorés par Git. Vérifier que `uploads/` l'est aussi avant tout commit.
- Montants en DZD, interface en français.
- Répondre et commenter le code en français.
