// Point d'entrée principal du backend FormEase
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const logger = require('./utils/logger');

// Chargement des variables d'environnement
dotenv.config();

const app = express();

// Import des middlewares de sécurité
const { 
  securityHeaders, 
  apiLimiter, 
  checkCriticalSecrets, 
  errorHandler 
} = require('./middleware/security');

// Vérification des secrets critiques au démarrage
app.use(checkCriticalSecrets);

// Middleware de sécurité
app.use(securityHeaders);

// Configuration CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting global
app.use('/api', apiLimiter);

// Middleware de parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Importation des routes
const authRoutes = require('./routes/auth');
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

// Importation de la route de gestion des QR codes
const qrcodeRoutes = require('./routes/qrcodes');
app.use('/api/qrcodes', qrcodeRoutes);

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

// Importation de la route de gestion des formulaires payants
const formPaymentRoutes = require('./routes/formPayment');
app.use('/api/form-payments', formPaymentRoutes);

// Importation de la route de gestion des emails
const emailRoutes = require('./routes/emails');
app.use('/api/emails', emailRoutes);

// Importation de la route de gestion des contacts
const contactRoutes = require('./routes/contact');
app.use('/api/contacts', contactRoutes);

// Importation de la route de gestion des feedbacks
const feedbackRoute = require('./routes/feedback');
app.use('/api/feedback', feedbackRoute);

// Importation de la route de gestion des coupons
// const couponRoutes = require('./routes/coupon');
// app.use('/api', couponRoutes);

// Documentation Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./docs/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Gestion globale des erreurs (middleware de sécurité)
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

// Ne démarrer le serveur que si ce fichier est exécuté directement
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`FormEase backend server started on port ${PORT}`);
    console.log(`Serveur FormEase backend démarré sur le port ${PORT}`);
  });
}

module.exports = app;