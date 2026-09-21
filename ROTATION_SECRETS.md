# Rotation des secrets — procédure

Le dépôt GitHub est **public** et un ancien mot de passe administrateur y figure dans l'historique (réécrire
l'historique n'y change rien : il faut faire tourner les secrets). Ce document ne contient aucun secret.

## 1. Générer les nouvelles valeurs (sur votre machine)

```bash
node backend/generate-secrets.js
```

Les valeurs ne s'affichent que dans votre terminal : ne les collez ni dans un chat, ni dans un ticket, ni dans Git.

## 2. Ce qu'il faut renouveler, et ce que ça change

| Secret | Où | Effet du changement |
|---|---|---|
| Mot de passe admin | `node backend/reset-admin-password.js <email> <nouveau_mot_de_passe>` (12 caractères minimum) sur le serveur de production | Ferme aussi la session admin ouverte (le `refresh_token` est remis à NULL) |
| `JWT_SECRET` | Variables d'environnement de production | **Toutes les sessions en cours sont fermées** (les utilisateurs se reconnectent) |
| `JWT_REFRESH_SECRET` | idem (doit être différent de `JWT_SECRET`) | Les renouvellements de session en cours échouent → reconnexion |
| `LICENSE_HMAC_SECRET` | idem | Aucun impact sur les licences déjà émises (elles sont contrôlées par recherche en base) ; ne sert qu'aux nouvelles clés. Ne jamais le partager avec le secret embarqué dans l'application vendue |
| Mot de passe PostgreSQL | Hébergeur de la base, puis `DATABASE_URL` / `DB_PASSWORD` | Redémarrage de l'API nécessaire |
| SMTP (`SMTP_PASS`) | Fournisseur d'emails, puis variable | Les emails partent à nouveau (le mot de passe d'application Gmail actuel est invalide) |
| `SATIM_MERCHANT_KEY`, `ANTHROPIC_API_KEY` | Portails SATIM / Anthropic | À renouveler si un doute existe sur leur exposition |
| Jetons d'hébergement (Railway, Vercel, GitHub) | Tableaux de bord respectifs | Révoquer ceux qui ne servent plus |

Ordre conseillé : mot de passe admin → secrets JWT → base de données → SMTP → le reste. Redéployer une fois après
avoir changé les variables (une seule interruption).

## 3. Vérifier

1. Au démarrage, l'API journalise `[ENV] ⚠️ …` pour chaque secret manquant, faible ou identique à un autre ; il ne doit
   plus rester d'avertissement (`JWT_SECRET` absent en production arrête l'API).
2. L'ancien mot de passe administrateur ne permet plus de se connecter ; le nouveau, si.
3. `GET /health` répond `ok` ; une connexion utilisateur et un renouvellement de session fonctionnent.
4. Optionnel — fermer toutes les sessions sans attendre : `UPDATE users SET refresh_token = NULL;`

## 4. Après coup

- Rendre le dépôt privé si le code n'a pas vocation à être public (GitHub → Settings → Danger zone).
- Ne jamais committer de `.env` : `.gitignore` les exclut, `backend/.env.example` liste les variables attendues.
- Si un secret a été collé ailleurs (chat, capture d'écran, email), le considérer comme compromis et le renouveler.
