/**
 * @fileoverview Authentication middleware for JWT token validation
 * @description Validates JWT tokens and attaches user information to requests
 * @security Critical security middleware - handles authentication
 * @compliance Follows security best practices and logging standards
 */

const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const { promisify } = require("util");

// Promisify jwt.verify for better async handling
const verifyAsync = promisify(jwt.verify);

/**
 * Middleware to verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 * @throws {Error} 401 for missing/invalid tokens, 500 for config errors
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      logger.warn("Missing authentication token", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        endpoint: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return res.status(401).json({
        message: "Token d'authentification manquant",
        error: "TOKEN_REQUIRED",
      });
    }

    // Critical security check - JWT secret must be configured
    if (!process.env.JWT_SECRET) {
      logger.error("CRITICAL: JWT_SECRET environment variable is missing", {
        timestamp: new Date().toISOString(),
        endpoint: req.originalUrl,
      });
      return res.status(500).json({
        message: "Configuration serveur manquante",
        error: "CONFIGURATION_ERROR",
      });
    }

    // Verify token asynchronously
    const user = await verifyAsync(token, process.env.JWT_SECRET);

    // Validate user object structure
    if (!user || !user.id) {
      logger.warn("Invalid user data in token payload", {
        ip: req.ip,
        endpoint: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return res.status(401).json({
        message: "Token invalide - données utilisateur manquantes",
        error: "INVALID_USER_DATA",
      });
    }

    // Security audit log
    logger.info("Token validation successful", {
      userId: user.id,
      ip: req.ip,
      endpoint: req.originalUrl,
      timestamp: new Date().toISOString(),
    });

    // Attach user to request for downstream middleware/controllers
    req.user = user;
    next();
  } catch (error) {
    logger.warn("Token verification failed", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
      error: error.name,
      message: error.message,
      timestamp: new Date().toISOString(),
    });

    return res.status(401).json({
      message: "Token invalide ou expiré",
      error: "INVALID_TOKEN",
    });
  }
};

/**
 * Middleware to check if user has admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    // Check if user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        message: "Authentification requise",
        error: "AUTHENTICATION_REQUIRED",
      });
    }

    // Check if user has required role
    if (req.user.role !== requiredRole) {
      logger.warn("Insufficient permissions", {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRole: requiredRole,
        endpoint: req.originalUrl,
        timestamp: new Date().toISOString(),
      });

      return res.status(403).json({
        message: "Permissions insuffisantes",
        error: "INSUFFICIENT_PERMISSIONS",
      });
    }

    next();
  };
};

// Export both named and default exports for flexibility and testability
module.exports = authMiddleware;
module.exports.auth = authMiddleware;
module.exports.authenticateToken = authMiddleware;
module.exports.default = authMiddleware;
module.exports.requireRole = requireRole;
