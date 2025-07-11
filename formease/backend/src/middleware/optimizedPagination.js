/**
 * Middleware de pagination optimisée v2.0
 * Gestion intelligente de la pagination avec cache et optimisations
 */
const { logger } = require('../utils/logger');
const { getRedisClient } = require('./rateLimiting');

/**
 * Configuration par défaut de la pagination
 */
const DEFAULT_CONFIG = {
    defaultLimit: 20,
    maxLimit: 100,
    defaultPage: 1,
    cacheTimeout: 300, // 5 minutes
    enableCache: process.env.NODE_ENV === 'production'
};

/**
 * Valide et normalise les paramètres de pagination
 */
function validatePaginationParams(query) {
    const page = Math.max(1, parseInt(query.page) || DEFAULT_CONFIG.defaultPage);
    const limit = Math.min(
        DEFAULT_CONFIG.maxLimit,
        Math.max(1, parseInt(query.limit) || DEFAULT_CONFIG.defaultLimit)
    );
    const offset = (page - 1) * limit;
    
    return { page, limit, offset };
}

/**
 * Génère une clé de cache pour la pagination
 */
function generateCacheKey(req, pagination) {
    const baseKey = `pagination:${req.method}:${req.path}`;
    const queryString = JSON.stringify({
        ...req.query,
        page: pagination.page,
        limit: pagination.limit
    });
    
    return `${baseKey}:${Buffer.from(queryString).toString('base64')}`;
}

/**
 * Middleware de pagination principal
 */
function optimizedPagination(req, res, next) {
    // Ignorer pour les méthodes non-GET
    if (req.method !== 'GET') {
        return next();
    }
    
    try {
        // Validation et normalisation des paramètres
        const pagination = validatePaginationParams(req.query);
        
        // Ajout des métadonnées de pagination à la requête
        req.pagination = {
            ...pagination,
            cacheKey: generateCacheKey(req, pagination)
        };
        
        // Fonction utilitaire pour créer la réponse paginée
        req.createPaginatedResponse = function(data, totalCount) {
            const totalPages = Math.ceil(totalCount / pagination.limit);
            const hasNext = pagination.page < totalPages;
            const hasPrev = pagination.page > 1;
            
            return {
                data,
                pagination: {
                    page: pagination.page,
                    limit: pagination.limit,
                    total: totalCount,
                    totalPages,
                    hasNext,
                    hasPrev,
                    nextPage: hasNext ? pagination.page + 1 : null,
                    prevPage: hasPrev ? pagination.page - 1 : null
                },
                meta: {
                    timestamp: new Date().toISOString(),
                    cached: false
                }
            };
        };
        
        // Fonction pour mettre en cache la réponse
        req.cacheResponse = async function(responseData) {
            if (!DEFAULT_CONFIG.enableCache) return;
            
            try {
                const redis = getRedisClient();
                if (!redis) return;
                
                await redis.setex(
                    req.pagination.cacheKey,
                    DEFAULT_CONFIG.cacheTimeout,
                    JSON.stringify(responseData)
                );
                
                logger.debug('Réponse mise en cache', {
                    cacheKey: req.pagination.cacheKey,
                    timeout: DEFAULT_CONFIG.cacheTimeout
                });
            } catch (error) {
                logger.warn('Erreur lors de la mise en cache', {
                    error: error.message,
                    cacheKey: req.pagination.cacheKey
                });
            }
        };
        
        // Vérification du cache avant de continuer
        if (DEFAULT_CONFIG.enableCache) {
            checkCache(req, res, next);
        } else {
            next();
        }
    } catch (error) {
        logger.error('Erreur dans le middleware de pagination', {
            error: error.message,
            query: req.query,
            path: req.path
        });
        next();
    }
}

/**
 * Vérifie si une réponse est en cache
 */
async function checkCache(req, res, next) {
    try {
        const redis = getRedisClient();
        if (!redis) return next();
        
        const cachedData = await redis.get(req.pagination.cacheKey);
        
        if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            parsedData.meta.cached = true;
            parsedData.meta.cachedAt = new Date().toISOString();
            
            logger.debug('Réponse servie depuis le cache', {
                cacheKey: req.pagination.cacheKey,
                path: req.path
            });
            
            // Ajouter les headers de cache
            res.set({
                'X-Cache': 'HIT',
                'X-Cache-Key': req.pagination.cacheKey,
                'Cache-Control': `public, max-age=${DEFAULT_CONFIG.cacheTimeout}`
            });
            
            return res.json(parsedData);
        }
        
        // Pas de cache trouvé, continuer
        res.set({
            'X-Cache': 'MISS',
            'X-Cache-Key': req.pagination.cacheKey
        });
        
        next();
    } catch (error) {
        logger.warn('Erreur lors de la vérification du cache', {
            error: error.message,
            cacheKey: req.pagination.cacheKey
        });
        next();
    }
}

/**
 * Middleware pour invalider le cache lors des modifications
 */
function invalidateCache(pattern = '*') {
    return async (req, res, next) => {
        try {
            const redis = getRedisClient();
            if (!redis) return next();
            
            // Invalider les clés de cache correspondant au pattern
            const keys = await redis.keys(`pagination:*${pattern}*`);
            
            if (keys.length > 0) {
                await redis.del(...keys);
                logger.debug('Cache invalidé', {
                    pattern,
                    keysDeleted: keys.length,
                    method: req.method,
                    path: req.path
                });
            }
            
            next();
        } catch (error) {
            logger.warn('Erreur lors de l\'invalidation du cache', {
                error: error.message,
                pattern
            });
            next();
        }
    };
}

/**
 * Middleware pour les limites de pagination spécialisées
 */
function createPaginationLimiter(config = {}) {
    const paginationConfig = { ...DEFAULT_CONFIG, ...config };
    
    return (req, res, next) => {
        if (req.method !== 'GET') return next();
        
        const pagination = validatePaginationParams(req.query);
        
        // Appliquer les limites personnalisées
        pagination.limit = Math.min(paginationConfig.maxLimit, pagination.limit);
        
        req.pagination = {
            ...pagination,
            cacheKey: generateCacheKey(req, pagination)
        };
        
        next();
    };
}

/**
 * Utilitaire pour créer des requêtes SQL paginées
 */
function createPaginatedQuery(baseQuery, pagination) {
    return `
        ${baseQuery}
        LIMIT ${pagination.limit}
        OFFSET ${pagination.offset}
    `;
}

/**
 * Utilitaire pour créer des requêtes Prisma paginées
 */
function createPrismaParams(pagination) {
    return {
        skip: pagination.offset,
        take: pagination.limit
    };
}

/**
 * Middleware de surveillance des performances de pagination
 */
function paginationMetrics(req, res, next) {
    if (req.method !== 'GET' || !req.pagination) return next();
    
    const startTime = Date.now();
    
    // Override de res.json pour capturer les métriques
    const originalJson = res.json;
    res.json = function(data) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Log des métriques de performance
        logger.info('Métriques de pagination', {
            path: req.path,
            page: req.pagination.page,
            limit: req.pagination.limit,
            duration,
            cached: data.meta?.cached || false,
            totalResults: data.pagination?.total || 0
        });
        
        // Ajouter les headers de performance
        res.set({
            'X-Response-Time': `${duration}ms`,
            'X-Pagination-Page': req.pagination.page,
            'X-Pagination-Limit': req.pagination.limit
        });
        
        return originalJson.call(this, data);
    };
    
    next();
}

module.exports = {
    optimizedPagination,
    invalidateCache,
    createPaginationLimiter,
    createPaginatedQuery,
    createPrismaParams,
    paginationMetrics,
    validatePaginationParams,
    DEFAULT_CONFIG
};
