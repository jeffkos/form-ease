// Point d'entrée principal du backend FormEase
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Chargement des variables d'environnement
dotenv.config();

// Vérification des variables d'environnement critiques
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is required');
  process.exit(1);
}

const app = express();

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: false, // Désactivé pour Swagger UI
  crossOriginEmbedderPolicy: false
}));

// Configuration CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP par fenêtre
  message: {
    error: 'Trop de requêtes. Réessayez dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting spécifique pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives de connexion par IP
  message: {
    error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting pour l'inscription
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // 3 inscriptions par IP par heure
  message: {
    error: 'Trop d\'inscriptions. Réessayez dans 1 heure.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Importation de la route d'authentification avec rate limiting
const authRoutes = require('./routes/auth');
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth', authRoutes);

// Importation de la route de paiement
const paymentRoutes = require('./routes/payment');
app.use('/api/payment', paymentRoutes);

// Importation de la route de gestion des formulaires
const formRoutes = require('./routes/form');
app.use('/api/forms', formRoutes);

// Importation de la route de gestion des champs de formulaire
const formFieldRoutes = require('./routes/formField');
app.use('/api/forms', formFieldRoutes);

// Importation de la route de gestion des inscriptions
const submissionRoutes = require('./routes/submission');
app.use('/api/submissions', submissionRoutes);

// Importation de la route des statistiques (dashboard)
const statsRoutes = require('./routes/stats');
app.use('/api/stats', statsRoutes);

// Importation de la route de gestion des templates d'email (admin/superadmin)
const emailTemplateRoutes = require('./routes/emailTemplate');
app.use('/api/email-templates', emailTemplateRoutes);

// Importation de la route d'archivage avancé
const archiveRoutes = require('./routes/archive');
app.use('/api/archive', archiveRoutes);

// Importation de la route RGPD (export/suppression données utilisateur)
const rgpdRoutes = require('./routes/rgpd');
app.use('/api/rgpd', rgpdRoutes);

// Importation de la route des logs d'action admin (audit trail)
const actionLogRoutes = require('./routes/actionLog');
app.use('/api/action-logs', actionLogRoutes);

// Documentation Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./docs/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Gestion globale des erreurs (monitoring)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

// Ne démarrer le serveur que si ce fichier est exécuté directement
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Serveur FormEase backend démarré sur le port ${PORT}`);
  });
}

module.exports = app;