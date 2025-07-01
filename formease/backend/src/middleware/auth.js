// Middleware pour vérifier le token JWT
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    logger.warn('Missing authentication token', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });
    return res.status(401).json({ 
      message: 'Token d\'authentification manquant',
      error: 'TOKEN_REQUIRED' 
    });
  }
  
  // Vérification critique du secret JWT
  if (!process.env.JWT_SECRET) {
    logger.error('CRITICAL: JWT_SECRET environment variable is missing');
    return res.status(500).json({ 
      message: 'Configuration serveur manquante',
      error: 'CONFIGURATION_ERROR' 
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Invalid or expired token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        error: err.name
      });
      return res.status(401).json({ 
        message: 'Token invalide ou expiré',
        error: 'INVALID_TOKEN' 
      });
    }
    
    // Log de succès pour audit
    logger.info('Token validation successful', {
      userId: user.id,
      ip: req.ip,
      endpoint: req.originalUrl
    });
    
    req.user = user;
    next();
  });
};
