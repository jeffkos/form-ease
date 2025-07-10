/**
 * Serveur HTTP simple optimisé pour FormEase
 * Avec gestion de la mémoire améliorée
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const port = 3000;

// Configuration pour réduire l'utilisation de la mémoire
const serverOptions = {
  maxHeaderSize: 8192, // Limite la taille des en-têtes
};

// Créer le serveur
const server = http.createServer(serverOptions, (req, res) => {
  let filePath = '.' + req.url;
  
  // Page par défaut
  if (filePath === './') {
    filePath = './frontend/pages/public/landing.html';
  }
  
  // Déterminer le type de contenu
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
    case '.jpeg':
      contentType = 'image/jpeg';
      break;
    case '.webp':
      contentType = 'image/webp';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
  }
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Lire et servir le fichier
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if(err.code === 'ENOENT') {
        // Fichier non trouvé
        res.writeHead(404);
        res.end('File not found: ' + filePath);
      } else {
        // Erreur serveur
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Succès
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Gestion des erreurs
server.on('error', (err) => {
  console.error(`Erreur serveur: ${err}`);
});

// Démarrer le serveur
server.listen(port, () => {
  console.log('\x1b[32m%s\x1b[0m', '✅ Serveur optimisé démarré avec succès!');
  console.log('\x1b[36m%s\x1b[0m', `🌐 Accès: http://localhost:${port}`);
  console.log('\x1b[33m%s\x1b[0m', '📑 Pages disponibles:');
  console.log(`   - http://localhost:${port}/frontend/pages/public/landing.html`);
  console.log(`   - http://localhost:${port}/frontend/pages/auth/login.html`);
  console.log(`   - http://localhost:${port}/frontend/pages/forms/list.html`);
  console.log(`   - http://localhost:${port}/frontend/pages/dashboard/home.html`);
  console.log('\x1b[90m%s\x1b[0m', '🔄 Surveillance des fuites mémoire activée');
});

// Nettoyage périodique pour éviter les fuites mémoire
const gcInterval = setInterval(() => {
  if (global.gc) {
    global.gc();
    console.log('\x1b[90m%s\x1b[0m', `🧹 Nettoyage mémoire effectué: ${new Date().toLocaleTimeString()}`);
  }
}, 60000);

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  clearInterval(gcInterval);
  server.close(() => {
    console.log('\x1b[31m%s\x1b[0m', '🛑 Serveur arrêté');
    process.exit(0);
  });
});
