// Middleware de sécurité centralisé
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Configuration des headers de sécurité
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Rate limiting pour les routes d'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 tentatives par IP
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded for auth', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });
    
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
    });
  }
});

// Rate limiting pour les routes API générales
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Maximum 100 requêtes par IP
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Trop de requêtes. Réessayez dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded for API', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });
    
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Trop de requêtes. Réessayez dans 15 minutes.'
    });
  }
});

// Rate limiting strict pour les routes sensibles (création de compte, etc.)
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // Maximum 3 tentatives par IP
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Trop de tentatives. Réessayez dans 1 heure.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Strict rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });
    
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Trop de tentatives. Réessayez dans 1 heure.'
    });
  }
});

// Middleware de log de sécurité
const securityLogger = (req, res, next) => {
  // Log des requêtes sensibles
  const sensitiveEndpoints = ['/api/auth/login', '/api/auth/register', '/api/auth/profile'];
  
  if (sensitiveEndpoints.some(endpoint => req.originalUrl.includes(endpoint))) {
    logger.info('Security-sensitive request', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Middleware de vérification des secrets critiques
const checkCriticalSecrets = (req, res, next) => {
  const requiredSecrets = ['JWT_SECRET', 'DATABASE_URL'];
  const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);
  
  if (missingSecrets.length > 0) {
    logger.error('Critical secrets missing', { missingSecrets });
    return res.status(500).json({
      error: 'CONFIGURATION_ERROR',
      message: 'Configuration serveur manquante'
    });
  }
  
  next();
};

// Middleware de sécurisation des erreurs (éviter l'exposition de stack traces)
const errorHandler = (err, req, res, next) => {
  // Log de l'erreur complète
  logger.error('Application error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Réponse sécurisée sans détails techniques
  if (res.headersSent) {
    return next(err);
  }

  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Une erreur interne s\'est produite',
    ...(isDevelopment && { details: err.message, stack: err.stack })
  });
};

module.exports = {
  securityHeaders,
  authLimiter,
  apiLimiter,
  strictLimiter,
  securityLogger,
  checkCriticalSecrets,
  errorHandler
};
