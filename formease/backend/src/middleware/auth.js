// Middleware pour vérifier le token JWT
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token d\'authentification manquant' });
  }
  
  // Vérification critique du secret JWT
  if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET environment variable is required');
    return res.status(500).json({ message: 'Configuration serveur manquante' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide ou expiré' });
    }
    req.user = user;
    next();
  });
};
