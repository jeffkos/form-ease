// Middleware global de gestion des erreurs (monitoring)
const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    user: req.user?.id || null
  });
  res.status(500).json({ message: 'Erreur serveur', error: err.message });
};
