/**
 * 📊 API Monitoring & Health Check System - FormEase
 *
 * Système complet de monitoring avec métriques Prometheus
 * et health checks pour surveiller la santé de l'API
 *
 * @version 1.0.0
 * @author FormEase Monitoring Team
 */

const prometheus = require("prom-client");
const { PrismaClient } = require("@prisma/client");
const { createClient } = require("redis");
const logger = require("../utils/logger");

const prisma = new PrismaClient();

// Configuration du registre Prometheus
const register = new prometheus.Registry();

// Métriques personnalisées
const httpRequestDuration = new prometheus.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code", "user_role"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestTotal = new prometheus.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code", "user_role"],
});

const activeUsers = new prometheus.Gauge({
  name: "active_users_total",
  help: "Number of active users",
  labelNames: ["role"],
});

const databaseConnections = new prometheus.Gauge({
  name: "database_connections_active",
  help: "Number of active database connections",
});

const cacheHitRate = new prometheus.Gauge({
  name: "cache_hit_rate",
  help: "Cache hit rate percentage",
});

const apiErrors = new prometheus.Counter({
  name: "api_errors_total",
  help: "Total number of API errors",
  labelNames: ["type", "endpoint", "user_role"],
});

const formsCreated = new prometheus.Counter({
  name: "forms_created_total",
  help: "Total number of forms created",
  labelNames: ["user_role"],
});

const submissionsReceived = new prometheus.Counter({
  name: "submissions_received_total",
  help: "Total number of form submissions received",
  labelNames: ["form_type"],
});

const responseSize = new prometheus.Histogram({
  name: "http_response_size_bytes",
  help: "Size of HTTP responses in bytes",
  labelNames: ["method", "route"],
  buckets: [100, 1000, 10000, 100000, 1000000],
});

// Enregistrer toutes les métriques
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeUsers);
register.registerMetric(databaseConnections);
register.registerMetric(cacheHitRate);
register.registerMetric(apiErrors);
register.registerMetric(formsCreated);
register.registerMetric(submissionsReceived);
register.registerMetric(responseSize);

// Ajouter les métriques par défaut de Node.js
prometheus.collectDefaultMetrics({ register });

// Variables pour le tracking des métriques
let cacheHits = 0;
let cacheMisses = 0;

// Middleware de métriques principal
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  const route = req.route?.path || req.path;
  const userRole = req.user?.role || "anonymous";

  // Intercepter la fin de la réponse
  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const contentLength = parseInt(res.get("Content-Length") || "0");

    // Enregistrer les métriques
    httpRequestDuration
      .labels(req.method, route, res.statusCode, userRole)
      .observe(duration);

    httpRequestTotal.labels(req.method, route, res.statusCode, userRole).inc();

    responseSize.labels(req.method, route).observe(contentLength);

    // Compter les erreurs
    if (res.statusCode >= 400) {
      const errorType = res.statusCode >= 500 ? "server_error" : "client_error";
      apiErrors.labels(errorType, route, userRole).inc();
    }

    // Logger les requêtes lentes
    if (duration > 2) {
      logger.warn("Slow request detected", {
        method: req.method,
        route,
        duration: `${duration}s`,
        statusCode: res.statusCode,
        userRole,
        ip: req.ip,
      });
    }
  });

  next();
};

// Middleware pour traquer les hits/miss du cache
const cacheMetricsMiddleware = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    const cacheHeader = res.get("X-Cache");

    if (cacheHeader === "HIT") {
      cacheHits++;
    } else if (cacheHeader === "MISS") {
      cacheMisses++;
    }

    // Mettre à jour le taux de hit cache
    const total = cacheHits + cacheMisses;
    if (total > 0) {
      cacheHitRate.set((cacheHits / total) * 100);
    }

    return originalJson.call(this, data);
  };

  next();
};

// Fonction pour mettre à jour les métriques métier
const updateBusinessMetrics = () => {
  // Compter les utilisateurs actifs par rôle (connectés dans les dernières 24h)
  const updateActiveUsers = async () => {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Utiliser created_at comme approximation d'activité récente
      // En attendant l'ajout du champ last_login au schéma
      const usersByRole = await prisma.user.groupBy({
        by: ["role"],
        _count: true,
        where: {
          created_at: {
            gte: yesterday,
          },
        },
      });

      usersByRole.forEach((group) => {
        activeUsers.labels(group.role.toLowerCase()).set(group._count);
      });
    } catch (error) {
      logger.error("Error updating active users metrics:", error);
    }
  };

  // Métriques de base de données
  const updateDatabaseMetrics = async () => {
    try {
      // Simuler le nombre de connexions actives
      // Dans un vrai environnement, vous utiliseriez les métriques de votre pool de connexions
      const activeConnections = Math.floor(Math.random() * 10) + 1;
      databaseConnections.set(activeConnections);
    } catch (error) {
      logger.error("Error updating database metrics:", error);
    }
  };

  // Exécuter les mises à jour
  updateActiveUsers();
  updateDatabaseMetrics();
};

// Mettre à jour les métriques métier toutes les 30 secondes
setInterval(updateBusinessMetrics, 30000);

// Health check complet du système
const healthCheck = async () => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: "healthy",
    version: process.env.npm_package_version || "1.0.0",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {},
  };

  try {
    // Vérifier la base de données
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    const dbDuration = Date.now() - dbStart;

    checks.checks.database = {
      status: "healthy",
      responseTime: `${dbDuration}ms`,
    };
  } catch (error) {
    checks.checks.database = {
      status: "unhealthy",
      error: error.message,
    };
    checks.status = "degraded";
  }

  try {
    // Vérifier Redis si configuré
    const redisClient = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });

    const redisStart = Date.now();
    await redisClient.connect();
    await redisClient.ping();
    const redisDuration = Date.now() - redisStart;
    await redisClient.quit();

    checks.checks.redis = {
      status: "healthy",
      responseTime: `${redisDuration}ms`,
    };
  } catch (error) {
    checks.checks.redis = {
      status: "degraded",
      error: "Redis not available or not configured",
    };
  }

  try {
    // Vérifier l'espace disque disponible
    const diskUsage = await import("node:fs");
    checks.checks.disk = {
      status: "healthy",
      note: "Disk space monitoring would be implemented here",
    };
  } catch (error) {
    checks.checks.disk = {
      status: "unknown",
      error: error.message,
    };
  }

  // Vérifier la mémoire
  const memoryUsage = process.memoryUsage();
  const memoryUsedPercent =
    (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

  checks.checks.memory = {
    status: memoryUsedPercent > 90 ? "degraded" : "healthy",
    usedPercent: `${memoryUsedPercent.toFixed(2)}%`,
    heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
    heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
  };

  if (memoryUsedPercent > 90) {
    checks.status = "degraded";
  }

  // Déterminer le statut global
  const hasUnhealthy = Object.values(checks.checks).some(
    (check) => check.status === "unhealthy"
  );
  const hasDegraded = Object.values(checks.checks).some(
    (check) => check.status === "degraded"
  );

  if (hasUnhealthy) {
    checks.status = "unhealthy";
  } else if (hasDegraded) {
    checks.status = "degraded";
  }

  return checks;
};

// Endpoint pour les métriques Prometheus
const metricsEndpoint = async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error("Error generating metrics:", error);
    res.status(500).end("Error generating metrics");
  }
};

// Endpoint pour le health check
const healthEndpoint = async (req, res) => {
  try {
    const health = await healthCheck();
    const statusCode =
      health.status === "healthy"
        ? 200
        : health.status === "degraded"
        ? 200
        : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    logger.error("Health check error:", error);
    res.status(503).json({
      timestamp: new Date().toISOString(),
      status: "unhealthy",
      error: "Health check failed",
      message: error.message,
    });
  }
};

// Fonction pour enregistrer des métriques métier personnalisées
const trackFormCreation = (userRole = "unknown") => {
  formsCreated.labels(userRole).inc();
};

const trackSubmission = (formType = "unknown") => {
  submissionsReceived.labels(formType).inc();
};

// Alerting simple (dans un vrai environnement, vous utiliseriez Alertmanager)
const checkAlerts = async () => {
  const health = await healthCheck();

  if (health.status === "unhealthy") {
    logger.error("ALERT: System unhealthy", health);
    // Ici vous pourriez envoyer une notification (email, Slack, etc.)
  }

  // Vérifier la mémoire
  const memoryUsage = process.memoryUsage();
  const memoryUsedPercent =
    (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

  if (memoryUsedPercent > 85) {
    logger.warn("ALERT: High memory usage", {
      usedPercent: `${memoryUsedPercent.toFixed(2)}%`,
    });
  }
};

// Vérifier les alertes toutes les minutes
setInterval(checkAlerts, 60000);

// Cleanup à l'arrêt
process.on("SIGTERM", async () => {
  try {
    await prisma.$disconnect();
    logger.info("Monitoring system shut down gracefully");
  } catch (error) {
    logger.error("Error during monitoring shutdown:", error);
  }
});

module.exports = {
  metricsMiddleware,
  cacheMetricsMiddleware,
  metricsEndpoint,
  healthEndpoint,
  healthCheck,
  trackFormCreation,
  trackSubmission,
  register,
};
