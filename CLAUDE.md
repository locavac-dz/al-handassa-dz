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

## Consignes

- `.env`, `node_modules/` et `*.log` sont ignorés par Git. Vérifier que `uploads/` l'est aussi avant tout commit.
- Montants en DZD, interface en français.
- Répondre et commenter le code en français.
