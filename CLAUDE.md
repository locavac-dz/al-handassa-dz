# genie-civil-dz — Plateforme AL HANDASSA (site public + e-commerce)

Site public d'AL HANDASSA : annuaire d'entreprises, appels d'offres, recrutement, catalogue de logiciels et boutique en ligne (ouvrages et ressources techniques).

## Stack

- Frontend statique multi-pages (HTML/CSS/JS vanilla) à la racine
- Backend Express 5 dans `backend/`
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

- **Paiement SATIM** (`backend/src/config/satim-live.js`) : intégration réelle, signature HMAC-SHA256, webhooks. Toute modification touche de l'argent réel — ne jamais désactiver la vérification de signature, et tester en mode démo avant de déployer. Attention : `initiateSatim()` (`paymentController.js`) simule actuellement la réponse SATIM au lieu d'appeler l'API réelle ("Pour la démo, on simule la réponse") — à garder en tête avant de considérer le paiement carte comme opérationnel en prod.
- **Licences logicielles** (`software_licenses`, `backend/src/routes/licenses.js`, `backend/src/utils/license.js`) : émission de clés pour des produits `type='logiciels'` (ex. BétonLab DG), déclenchée automatiquement à la confirmation de paiement (`satimCallback`, `submitManualPayment` dans `paymentController.js`, et la validation manuelle admin dans `admin.js`). Le secret `LICENSE_HMAC_SECRET` (`.env`) ne doit jamais être partagé avec le secret client-side embarqué dans l'application vendue — voir le CLAUDE.md du produit concerné.
- **Sécurité** (`backend/src/middleware/securityHeaders.js`) : Helmet, rate limiting (API / login / paiements), CSP, HSTS, sanitisation des entrées. Ne pas affaiblir ces réglages.
- **Emails** (`backend/src/services/emailService.js`) : confirmations de commande, relances de panier abandonné, alertes admin via SMTP.
- `sitemap.xml` (88 Ko) et `robots.txt` sont maintenus pour le SEO — les régénérer après tout ajout de pages.

## Consignes

- `.env`, `node_modules/` et `*.log` sont ignorés par Git. Vérifier que `uploads/` l'est aussi avant tout commit.
- Montants en DZD, interface en français.
- Répondre et commenter le code en français.
