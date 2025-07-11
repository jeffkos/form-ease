/**
 * Middleware de sanitisation des données v2.0
 * Protection contre XSS, injection HTML, et nettoyage des données d'entrée
 */
const DOMPurify = require('isomorphic-dompurify');
const { logger } = require('../utils/logger');

/**
 * Configuration de sanitisation sécurisée
 */
const SANITIZE_CONFIG = {
    ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'
    ],
    ALLOWED_ATTR: ['href', 'title', 'alt', 'class'],
    FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover']
};

/**
 * Expressions régulières pour la détection de patterns malveillants
 */
const MALICIOUS_PATTERNS = [
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi
];

/**
 * Nettoie une chaîne de caractères
 */
function sanitizeString(value) {
    if (typeof value !== 'string') return value;
    
    // Détection de patterns malveillants
    for (const pattern of MALICIOUS_PATTERNS) {
        if (pattern.test(value)) {
            logger.warn('Pattern malveillant détecté et supprimé', { pattern: pattern.source });
            value = value.replace(pattern, '');
        }
    }
    
    // Sanitisation HTML avec DOMPurify
    return DOMPurify.sanitize(value, SANITIZE_CONFIG);
}

/**
 * Sanitise récursivement un objet
 */
function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
}

/**
 * Middleware de sanitisation
 */
function sanitizeMiddleware(req, res, next) {
    try {
        // Sanitisation du body
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObject(req.body);
        }
        
        // Sanitisation des query parameters
        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeObject(req.query);
        }
        
        // Sanitisation des params
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeObject(req.params);
        }
        
        // Log de l'activité de sanitisation (en mode debug uniquement)
        if (process.env.NODE_ENV === 'development') {
            logger.debug('Données sanitisées', {
                ip: req.ip,
                method: req.method,
                path: req.path,
                userAgent: req.get('User-Agent')
            });
        }
        
        next();
    } catch (error) {
        logger.error('Erreur lors de la sanitisation', {
            error: error.message,
            stack: error.stack,
            path: req.path,
            method: req.method
        });
        
        // En cas d'erreur, on continue mais on log l'incident
        next();
    }
}

/**
 * Middleware de validation des Content-Types
 */
function validateContentType(req, res, next) {
    const allowedTypes = [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
        'text/plain'
    ];
    
    const contentType = req.get('Content-Type');
    
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        if (contentType && !allowedTypes.some(type => contentType.includes(type))) {
            logger.warn('Content-Type non autorisé', {
                contentType,
                ip: req.ip,
                path: req.path
            });
            
            return res.status(415).json({
                error: 'Content-Type non supporté',
                supportedTypes: allowedTypes
            });
        }
    }
    
    next();
}

/**
 * Middleware de protection contre les payloads trop volumineux
 */
function validatePayloadSize(maxSize = 10 * 1024 * 1024) { // 10MB par défaut
    return (req, res, next) => {
        const contentLength = parseInt(req.get('Content-Length')) || 0;
        
        if (contentLength > maxSize) {
            logger.warn('Payload trop volumineux rejeté', {
                contentLength,
                maxSize,
                ip: req.ip,
                path: req.path
            });
            
            return res.status(413).json({
                error: 'Payload trop volumineux',
                maxSize: `${maxSize / 1024 / 1024}MB`,
                receivedSize: `${contentLength / 1024 / 1024}MB`
            });
        }
        
        next();
    };
}

/**
 * Configuration de sanitisation pour différents types de données
 */
const FIELD_SANITIZERS = {
    email: (value) => {
        if (typeof value !== 'string') return value;
        return value.toLowerCase().trim().replace(/[^\w@.-]/g, '');
    },
    
    phone: (value) => {
        if (typeof value !== 'string') return value;
        return value.replace(/[^\d+\-\s()]/g, '');
    },
    
    url: (value) => {
        if (typeof value !== 'string') return value;
        try {
            const url = new URL(value);
            return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
        } catch {
            return '';
        }
    },
    
    text: sanitizeString,
    html: sanitizeString
};

/**
 * Middleware de sanitisation spécialisée par champ
 */
function createFieldSanitizer(fieldConfig) {
    return (req, res, next) => {
        try {
            if (req.body) {
                for (const [field, type] of Object.entries(fieldConfig)) {
                    if (req.body[field] !== undefined && FIELD_SANITIZERS[type]) {
                        req.body[field] = FIELD_SANITIZERS[type](req.body[field]);
                    }
                }
            }
            next();
        } catch (error) {
            logger.error('Erreur lors de la sanitisation spécialisée', {
                error: error.message,
                fieldConfig,
                path: req.path
            });
            next();
        }
    };
}

module.exports = {
    sanitize: sanitizeMiddleware,
    validateContentType,
    validatePayloadSize,
    createFieldSanitizer,
    sanitizeString,
    sanitizeObject,
    FIELD_SANITIZERS
};
