# Tests d'intégration du backend

Tests `node:test` (aucune dépendance ajoutée) : ils démarrent l'application Express sur un port libre et l'appellent en
HTTP contre une **vraie base PostgreSQL de test**. Les emails sont interceptés (aucun envoi réel).

## Préparer la base de test (une fois)

```bash
# 1. créer la base — son nom DOIT contenir « test » (garde-fou : les tests écrivent et suppriment des lignes)
psql -U postgres -c "CREATE DATABASE handassi_test"

# 2. appliquer schema.sql + toutes les migrations
cd backend
DATABASE_URL=postgres://postgres:postgres@localhost:5432/handassi_test DB_SSL=false npm run migrate
```

Une autre base ou d'autres identifiants : `TEST_DATABASE_URL=postgres://user:mdp@hote:5432/ma_base_test`.
Après avoir ajouté une migration, relancer l'étape 2.

## Lancer

```bash
cd backend
npm test                    # tous les fichiers, l'un après l'autre
node tests/run.js payments  # seulement les fichiers dont le nom contient « payments »
```

## Ce qui est couvert

| Fichier | Sujet |
|---|---|
| `payments.test.js` | Retour SATIM (signature vraie / fausse / absente, rejeu concurrent, commande annulée), validation et rejet admin, activation d'abonnement |
| `orders.test.js` | Paiement CCP déclaré par le client (ne débloque rien), statut admin (`settleOrder`, remboursement, révocations) |
| `paywall.test.js` | `has_file`, garde `/uploads`, téléchargement authentifié, vidéos, jetons de streaming signés |
| `access-rules.test.js` | Avis réservés aux acheteurs, codes prépayés (course entre 12 comptes) |
| `security.test.js` | Limiteurs de débit, fichiers du dépôt jamais servis, CSP page / API |
| `catalog.test.js` | Recherche produit, pagination, sitemap dynamique |
| `env.test.js` | Contrôle des variables d'environnement au démarrage (sans base) |

## Écrire un test

- `require('./helpers')` **en premier** : il fixe l'environnement de test avant le chargement de l'application.
- Préfixer toutes les données créées (`tabc-…` pour les slugs, `tabc-…@example.com` pour les comptes) et appeler
  `h.purge('tabc')` avant et après : la base est partagée entre les fichiers et n'est jamais réinitialisée.
- Vérifier qu'un nouveau test **échoue vraiment** quand le code est cassé (introduire la régression, constater
  l'échec, la retirer). C'est ainsi qu'a été trouvé le cas « signature SATIM fausse », qui n'était pas couvert.

## CI

`.github/workflows/ci.yml` : PostgreSQL 16 vierge → migrations depuis zéro → migrations une seconde fois
(idempotence) → `npm test` (Node 20 et 22), plus la construction de l'image Docker.
