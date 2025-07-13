/**
 * 🛡️ Rate Limiting Middleware - FormEase API Security
 *
 * Système de limitation de taux granulaire pour protéger l'API
 * contre les attaques par déni de service et la surcharge
 *
 * @version 1.0.0
 * @author FormEase Security Team
 */

const rateLimit = require("express-rate-limit");
const { createClient } = require("redis");
const logger = require("../utils/logger");

// Configuration Redis pour le stockage des compteurs
let redisClient = null;

// Fonction pour créer la connexion Redis de manière paresseuse
const getRedisClient = () => {
  if (!redisClient && process.env.NODE_ENV !== "test") {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL || "redis://localhost:6379",
        retry_strategy: (options) => {
          if (options.error && options.error.code === "ECONNREFUSED") {
            logger.warn(
              "Redis connection refused, falling back to memory store"
            );
            return undefined; // Utilise le store mémoire par défaut
          }
          return Math.min(options.attempt * 100, 3000);
        },
      });

      // Gestion des erreurs Redis avec vérification
      if (redisClient && typeof redisClient.on === "function") {
        redisClient.on("error", (err) => {
          logger.error("Redis Client Error:", err);
        });

        redisClient.on("connect", () => {
          logger.info("Redis Client Connected");
        });

        redisClient.on("ready", () => {
          logger.info("Redis Client Ready");
        });

        redisClient.on("end", () => {
          logger.info("Redis Client Disconnected");
        });
      }
    } catch (error) {
      logger.error("Failed to create Redis client:", error);
      redisClient = null;
    }
  }

  return redisClient;
};

// Store Redis personnalisé pour rate limiting
class RedisStore {
  constructor(options = {}) {
    this.prefix = options.prefix || "rl:";
    this.client = null;
    this.useRedis =
      process.env.NODE_ENV !== "test" && Boolean(process.env.REDIS_URL);
  }

  async getClient() {
    if (!this.useRedis) return null;

    if (!this.client) {
      this.client = getRedisClient();
      if (this.client && !this.client.isReady) {
        try {
          await this.client.connect();
        } catch (error) {
          logger.warn(
            "Failed to connect to Redis, falling back to memory store:",
            error.message
          );
          this.client = null;
          this.useRedis = false;
        }
      }
    }
    return this.client;
  }

  async increment(key) {
    const client = await this.getClient();
    if (!client) {
      // Fallback to in-memory counter (not persistent but works for tests)
      const inMemoryStore =
        global.__rateLimitStore || (global.__rateLimitStore = {});
      const fullKey = this.prefix + key;

      // Validation et nettoyage des données corrompues
      let currentValue = inMemoryStore[fullKey] || 0;
      if (typeof currentValue !== "number" || isNaN(currentValue)) {
        logger.warn(
          `Corrupted value detected for key ${fullKey}, resetting to 0`
        );
        currentValue = 0;
      }

      inMemoryStore[fullKey] = currentValue + 1;

      return {
        totalHits: inMemoryStore[fullKey],
        resetTime: new Date(Date.now() + 900000),
      };
    }

    try {
      const fullKey = this.prefix + key;
      const current = await client.incr(fullKey);

      if (current === 1) {
        await client.expire(fullKey, 900); // 15 minutes TTL
      }

      return {
        totalHits: current,
        resetTime: new Date(Date.now() + 900000),
      };
    } catch (error) {
      logger.error("Redis store error:", error);
      throw error;
    }
  }

  async decrement(key) {
    const client = await this.getClient();
    if (!client) {
      const inMemoryStore = global.__rateLimitStore || {};
      const fullKey = this.prefix + key;
      inMemoryStore[fullKey] = Math.max(0, (inMemoryStore[fullKey] || 0) - 1);
      return inMemoryStore[fullKey];
    }

    try {
      const fullKey = this.prefix + key;
      const current = await client.decr(fullKey);
      return Math.max(0, current);
    } catch (error) {
      logger.error("Redis store decrement error:", error);
      return 0;
    }
  }

  async resetKey(key) {
    const client = await this.getClient();
    if (!client) {
      const inMemoryStore = global.__rateLimitStore || {};
      const fullKey = this.prefix + key;
      delete inMemoryStore[fullKey];
      return;
    }

    try {
      const fullKey = this.prefix + key;
      await client.del(fullKey);
    } catch (error) {
      logger.error("Redis store reset error:", error);
    }
  }
}

// Configuration des limites par type d'endpoint
const limitConfigs = {
  // Authentification - Très restrictif
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 tentatives par IP
    message: {
      error: "TOO_MANY_AUTH_ATTEMPTS",
      message: "Trop de tentatives de connexion. Réessayez dans 15 minutes.",
      retryAfter: 15 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.ip === "127.0.0.1", // Skip pour localhost en dev
  },

  // API générale - Modéré
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requêtes par minute
    message: {
      error: "RATE_LIMIT_EXCEEDED",
      message: "Limite de requêtes dépassée. Réessayez dans une minute.",
      retryAfter: 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Upload de fichiers - Très restrictif
  upload: {
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 10, // 10 uploads par heure
    message: {
      error: "UPLOAD_LIMIT_EXCEEDED",
      message: "Limite d'upload dépassée. Réessayez dans une heure.",
      retryAfter: 60 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Utilisateurs premium - Plus permissif
  premium: {
    windowMs: 60 * 1000, // 1 minute
    max: 500, // 500 requêtes par minute
    message: {
      error: "PREMIUM_RATE_LIMIT_EXCEEDED",
      message: "Limite premium dépassée. Contactez le support.",
      retryAfter: 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.user?.plan !== "premium",
  },

  // API publique - Modéré
  public: {
    windowMs: 60 * 1000, // 1 minute
    max: 50, // 50 requêtes par minute
    message: {
      error: "PUBLIC_RATE_LIMIT_EXCEEDED",
      message: "Limite d'API publique dépassée.",
      retryAfter: 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // SMS standard - Restrictif
  smsLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 SMS par minute
    message: {
      error: "SMS_RATE_LIMIT_EXCEEDED",
      message: "Limite d'envoi SMS dépassée. Réessayez dans une minute.",
      retryAfter: 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // SMS en lot - Très restrictif
  smsBulkLimit: {
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 3, // 3 envois en lot par heure
    message: {
      error: "SMS_BULK_RATE_LIMIT_EXCEEDED",
      message: "Limite d'envoi SMS en lot dépassée. Réessayez dans une heure.",
      retryAfter: 60 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
  },
};

// Fonction pour créer un limiteur avec configuration personnalisée
function createRateLimiter(type) {
  // Validation stricte du type d'entrée
  if (typeof type !== "string") {
    throw new Error(
      `Rate limit type must be a string, received: ${typeof type}`
    );
  }

  if (!type || type.trim() === "") {
    throw new Error("Rate limit type cannot be empty");
  }

  const config = { ...limitConfigs[type] }; // Clone pour éviter les mutations

  if (!config) {
    throw new Error(`Unknown rate limit type: ${type}`);
  }

  // Ajouter le store Redis si disponible et pas en mode test
  if (process.env.NODE_ENV !== "test") {
    const client = getRedisClient();
    if (client) {
      config.store = new RedisStore({ prefix: `rl_${type}:` });
    }
  }

  // Handler personnalisé pour les erreurs de rate limiting
  config.handler = (req, res) => {
    logger.warn(`Rate limit exceeded for ${type}`, {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
      userId: req.user?.id,
      type: type,
    });

    res.status(429).json({
      success: false,
      error: config.message.error,
      message: config.message.message,
      retryAfter: config.message.retryAfter,
      timestamp: new Date().toISOString(),
    });
  };

  // Key generator personnalisé pour inclure l'utilisateur
  config.keyGenerator = (req) => {
    const baseKey = req.ip;
    const userKey = req.user?.id ? `user_${req.user.id}` : "anonymous";
    return `${baseKey}_${userKey}`;
  };

  return rateLimit(config);
}

// Middleware pour détecter les attaques de force brute
const bruteForceDetection = async (req, res, next) => {
  // Skip en mode test
  if (process.env.NODE_ENV === "test") {
    return next();
  }

  const client = getRedisClient();
  if (!client || !client.isReady) {
    return next();
  }

  const key = `bf:${req.ip}`;
  const threshold = 20; // 20 tentatives suspectes

  // Incrémenter le compteur d'activité suspecte
  if (req.path.includes("/auth/") || req.statusCode >= 400) {
    try {
      const count = await client.incr(key);
      await client.expire(key, 3600); // 1 heure

      if (count >= threshold) {
        logger.error(`Potential brute force attack detected`, {
          ip: req.ip,
          count: count,
          userAgent: req.get("User-Agent"),
          endpoint: req.originalUrl,
        });

        // Bloquer temporairement cette IP
        return res.status(429).json({
          error: "SUSPICIOUS_ACTIVITY_DETECTED",
          message: "Activité suspecte détectée. IP temporairement bloquée.",
          retryAfter: 3600,
        });
      }
    } catch (err) {
      logger.error("Brute force detection error:", err);
    }
  }

  next();
};

// Middleware pour whitelist des IPs
const ipWhitelist = (req, res, next) => {
  const whitelistedIPs = (process.env.WHITELISTED_IPS || "")
    .split(",")
    .map((ip) => ip.trim())
    .filter((ip) => ip.length > 0);

  if (whitelistedIPs.includes(req.ip)) {
    req.rateLimitBypass = true;
  }

  next();
};

// Middleware principal qui choisit le bon limiteur
const smartRateLimit = (req, res, next) => {
  // Bypass pour IPs whitelistées
  if (req.rateLimitBypass) {
    return next();
  }

  let limiterType = "api"; // Default

  // Déterminer le type de limiteur selon le endpoint
  if (req.path.includes("/auth/")) {
    limiterType = "auth";
  } else if (req.path.includes("/upload")) {
    limiterType = "upload";
  } else if (req.path.includes("/public/")) {
    limiterType = "public";
  } else if (req.user?.plan === "premium") {
    limiterType = "premium";
  }

  // Appliquer le limiteur approprié
  const limiter = createRateLimiter(limiterType);
  limiter(req, res, next);
};

// Middleware pour logger les violations de rate limit
const rateLimitLogger = (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    if (res.statusCode === 429) {
      logger.warn("Rate limit violation", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        endpoint: req.originalUrl,
        userId: req.user?.id,
        timestamp: new Date().toISOString(),
      });
    }

    originalSend.call(this, data);
  };

  next();
};

// Initialisation de Redis
const initializeRedis = async () => {
  if (process.env.NODE_ENV === "test") {
    logger.info("Skipping Redis initialization in test mode");
    return;
  }

  try {
    const client = getRedisClient();
    if (client && !client.isReady) {
      await client.connect();
      logger.info("Redis connected for rate limiting");
    }
  } catch (error) {
    logger.warn(
      "Redis connection failed, using memory store for rate limiting:",
      error.message
    );
  }
};

// Fonction pour fermer proprement Redis
const closeRedis = async () => {
  if (redisClient && redisClient.isReady) {
    try {
      await redisClient.quit();
      logger.info("Redis connection closed");
    } catch (error) {
      logger.error("Error closing Redis connection:", error);
    } finally {
      redisClient = null;
    }
  }
};

// Cleanup à l'arrêt
const cleanup = async () => {
  await closeRedis();
  // Nettoyer le store en mémoire pour les tests
  if (global.__rateLimitStore) {
    global.__rateLimitStore = {};
  }
};

process.on("SIGTERM", cleanup);
process.on("SIGINT", cleanup);

// Pour les tests Jest
if (process.env.NODE_ENV === "test") {
  beforeEach(() => {
    // Nettoyer le store en mémoire avant chaque test
    global.__rateLimitStore = {};
  });

  afterAll(async () => {
    await cleanup();
  });
}

// Créer les limiteurs avec gestion d'erreur
let premiumRateLimit;
let smsLimit;
let smsBulkLimit;

try {
  premiumRateLimit = createRateLimiter("premium");
  smsLimit = createRateLimiter("smsLimit");
  smsBulkLimit = createRateLimiter("smsBulkLimit");
} catch (error) {
  logger.warn("Erreur lors de la création des rate limiters:", error);
  // Créer des limiteurs de fallback en mode test
  premiumRateLimit = (req, res, next) => next();
  smsLimit = (req, res, next) => next();
  smsBulkLimit = (req, res, next) => next();
}

module.exports = {
  createRateLimiter,
  smartRateLimit,
  bruteForceDetection,
  ipWhitelist,
  rateLimitLogger,
  initializeRedis,
  closeRedis,
  cleanup,
  limitConfigs,
  getRedisClient,
  // Alias pour compatibilité avec enhanced-api.js
  rateLimiting: smartRateLimit,
  premiumRateLimit,

  // 📱 Rate Limiters SMS
  smsLimit,
  smsBulkLimit,
};
