# Image de production Al Handassa.dz — UNE seule image : Express sert l'API ET le front (racine du dépôt).
# Le dossier backend/uploads (PDF, vidéos, images) n'est PAS dans l'image : le monter sur un stockage persistant
# (Railway : volume monté sur /app/backend/uploads ; le mot-clé VOLUME est interdit par Railway).
FROM node:20-bookworm-slim

# Python + PyMuPDF : génération des aperçus PDF (backend/src/utils/generatePreview.js). Sans eux, l'upload d'un
# produit fonctionne mais aucun aperçu n'est produit.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-pip \
 && pip3 install --no-cache-dir --break-system-packages pymupdf \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dépendances du backend d'abord : cette couche n'est reconstruite que si package*.json change
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev

# Code (backend + pages du front). Le .dockerignore exclut .env, .git, uploads, node_modules, logs…
COPY . .

ENV NODE_ENV=production \
    PORT=5000

# Exécution sans root ; uploads/ doit être inscriptible (le volume Railway hérite de ces droits)
RUN mkdir -p backend/uploads && chown -R node:node /app
USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||5000)+'/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "backend/src/app.js"]
