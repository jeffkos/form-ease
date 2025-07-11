/**
 * 📊 API Performance & Cache Middleware - FormEase
 * 
 * Système de cache intelligent et optimisation des performances
 * pour améliorer les temps de réponse de l'API
 * 
 * @version 1.0.0
 * @author FormEase Performance Team
 */

const { createClient } = require('redis');
const compression = require('compression');
const helmet = require('helmet');
const logger = require('../utils/logger');

// Configuration Redis pour le cache
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      logger.warn('Redis connection refused, falling back to memory cache');
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

// Cache en mémoire de fallback
const memoryCache = new Map();
const memoryCacheExpiry = new Map();

// Initialisation Redis
const initializeCache = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis cache connected successfully');
  } catch (error) {
    logger.warn('Redis cache connection failed, using memory fallback:', error.message);
  }
};

// Nettoyage du cache mémoire expiré
setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of memoryCacheExpiry.entries()) {
    if (expiry < now) {
      memoryCache.delete(key);
      memoryCacheExpiry.delete(key);
    }
  }
}, 60000); // Nettoyer toutes les minutes

// Middleware de cache intelligent
const cache = (options = {}) => {
  const {
    duration = 300, // 5 minutes par défaut
    varyBy = ['url', 'user'], // Varier par URL et utilisateur
    condition = () => true, // Condition pour activer le cache
    skipCache = () => false, // Condition pour ignorer le cache
    prefix = 'api_cache:'
  } = options;

  return async (req, res, next) => {
    try {
      // Vérifier si on doit ignorer le cache
      if (skipCache(req) || req.method !== 'GET') {
        return next();
      }

      // Vérifier la condition d'activation
      if (!condition(req)) {
        return next();
      }

      // Générer la clé de cache
      let cacheKey = prefix;
      
      if (varyBy.includes('url')) {
        cacheKey += req.originalUrl;
      }
      
      if (varyBy.includes('user') && req.user?.id) {
        cacheKey += `:user_${req.user.id}`;
      }
      
      if (varyBy.includes('role') && req.user?.role) {
        cacheKey += `:role_${req.user.role}`;
      }

      // Tenter de récupérer depuis Redis d'abord
      let cachedData = null;
      
      if (redisClient.isReady) {
        try {
          cachedData = await redisClient.get(cacheKey);
        } catch (redisError) {
          logger.warn('Redis cache read error:', redisError);
        }
      }
      
      // Fallback sur le cache mémoire
      if (!cachedData && memoryCache.has(cacheKey)) {
        const expiry = memoryCacheExpiry.get(cacheKey);
        if (expiry > Date.now()) {
          cachedData = memoryCache.get(cacheKey);
        } else {
          memoryCache.delete(cacheKey);
          memoryCacheExpiry.delete(cacheKey);
        }
      }

      // Retourner les données en cache si disponibles
      if (cachedData) {
        const data = JSON.parse(cachedData);
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        return res.json(data);
      }

      // Intercepter la réponse pour la mettre en cache
      const originalJson = res.json;
      res.json = function(data) {
        // Ne mettre en cache que les réponses réussies
        if (res.statusCode === 200 && data) {
          const serializedData = JSON.stringify(data);
          const expiryTime = Date.now() + (duration * 1000);

          // Tenter de sauvegarder dans Redis
          if (redisClient.isReady) {
            redisClient.setex(cacheKey, duration, serializedData)
              .catch(err => logger.warn('Redis cache write error:', err));
          }

          // Sauvegarder dans le cache mémoire
          memoryCache.set(cacheKey, serializedData);
          memoryCacheExpiry.set(cacheKey, expiryTime);

          res.set('X-Cache', 'MISS');
          res.set('X-Cache-Key', cacheKey);
        }

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next(); // Continuer sans cache en cas d'erreur
    }
  };
};

// Middleware pour invalider le cache
const invalidateCache = (patterns = []) => {
  return async (req, res, next) => {
    try {
      // Invalider après une modification réussie
      const originalJson = res.json;
      res.json = function(data) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Invalider les patterns spécifiés
          patterns.forEach(pattern => {
            invalidateCachePattern(pattern, req);
          });
        }
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache invalidation error:', error);
      next();
    }
  };
};

// Fonction pour invalider les patterns de cache
const invalidateCachePattern = async (pattern, req) => {
  try {
    // Remplacer les variables dans le pattern
    const resolvedPattern = pattern
      .replace(':userId', req.user?.id || '*')
      .replace(':formId', req.params?.formId || req.body?.form_id || '*');

    // Invalider dans Redis
    if (redisClient.isReady) {
      const keys = await redisClient.keys(`api_cache:${resolvedPattern}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
        logger.debug(`Invalidated ${keys.length} Redis cache keys for pattern: ${resolvedPattern}`);
      }
    }

    // Invalider dans le cache mémoire
    const memoryKeys = Array.from(memoryCache.keys())
      .filter(key => key.includes(resolvedPattern.replace('*', '')));
    
    memoryKeys.forEach(key => {
      memoryCache.delete(key);
      memoryCacheExpiry.delete(key);
    });

    if (memoryKeys.length > 0) {
      logger.debug(`Invalidated ${memoryKeys.length} memory cache keys for pattern: ${resolvedPattern}`);
    }
  } catch (error) {
    logger.error('Cache pattern invalidation error:', error);
  }
};

// Middleware de compression intelligent
const intelligentCompression = compression({
  // Comprimer seulement si > 1KB
  threshold: 1024,
  
  // Filtrer les types de contenu à comprimer
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    const contentType = res.getHeader('content-type') || '';
    return compression.filter(req, res) && 
           (contentType.includes('json') || 
            contentType.includes('text') || 
            contentType.includes('javascript'));
  },
  
  // Niveau de compression adaptatif
  level: (req, res) => {
    const userAgent = req.get('User-Agent') || '';
    
    // Compression plus légère pour mobiles
    if (userAgent.includes('Mobile')) {
      return 6; // Compression moyenne
    }
    
    return 9; // Compression maximale pour desktop
  }
});

// Middleware pour les headers de performance
const performanceHeaders = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convertir en ms
    
    res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
    res.set('X-Process-Time', Date.now().toString());
  });
  
  // Headers de cache pour les ressources statiques
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
    res.set('Cache-Control', 'public, max-age=31536000'); // 1 an
  }
  
  next();
};

// Middleware pour limiter la taille des requêtes
const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxBytes = parseSize(maxSize);
    
    if (contentLength > maxBytes) {
      logger.warn('Request too large', {
        contentLength,
        maxBytes,
        ip: req.ip,
        endpoint: req.originalUrl
      });
      
      return res.status(413).json({
        success: false,
        error: 'REQUEST_TOO_LARGE',
        message: `Requête trop volumineuse. Taille maximum: ${maxSize}`,
        maxSize: maxBytes
      });
    }
    
    next();
  };
};

// Utilitaire pour parser les tailles
const parseSize = (size) => {
  const units = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 };
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)?$/);
  
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return Math.floor(value * units[unit]);
};

// Middleware de pagination optimisée
const optimizedPagination = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  
  // Ajouter les paramètres de pagination à req
  req.pagination = {
    page,
    limit,
    offset,
    skip: offset
  };
  
  // Fonction helper pour créer la réponse paginée
  req.createPaginatedResponse = (data, total) => ({
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
      nextPage: page * limit < total ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null
    }
  });
  
  next();
};

// Middleware pour détecter les bots et ajuster le cache
const botDetection = (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const botPatterns = [
    /googlebot/i,
    /bingbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /slackbot/i,
    /discordbot/i
  ];
  
  req.isBot = botPatterns.some(pattern => pattern.test(userAgent));
  
  // Cache plus long pour les bots
  if (req.isBot) {
    res.set('Cache-Control', 'public, max-age=3600'); // 1 heure
  }
  
  next();
};

// Cleanup à l'arrêt de l'application
process.on('SIGTERM', async () => {
  try {
    if (redisClient.isReady) {
      await redisClient.quit();
      logger.info('Redis cache connection closed');
    }
    
    memoryCache.clear();
    memoryCacheExpiry.clear();
    logger.info('Memory cache cleared');
  } catch (error) {
    logger.error('Error during cache cleanup:', error);
  }
});

module.exports = {
  initializeCache,
  cache,
  invalidateCache,
  invalidateCachePattern,
  intelligentCompression,
  performanceHeaders,
  requestSizeLimit,
  optimizedPagination,
  botDetection
};
