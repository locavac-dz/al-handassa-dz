// Serveur statique pour le frontend Al Handassa.dz
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Désactiver le cache sur JS et CSS (évite les problèmes de version)
app.use((req, res, next) => {
  if (req.path.match(/\.(js|css)$/)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// Servir tous les fichiers statiques
app.use(express.static(__dirname, {
  extensions: ['html'],   // /product => product.html
  index: 'index.html',
}));

// Fallback pour les routes SPA (ex: /article, /product, etc.)
app.use((req, res) => {
  const htmlFile = path.join(__dirname, req.path + '.html');
  if (fs.existsSync(htmlFile)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.sendFile(htmlFile);
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend Al Handassa.dz => http://localhost:${PORT}`);
});
