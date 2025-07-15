/**
 * FormEase - Serveur Backend Principal
 * Gestion des API pour les formulaires publics et backoffice
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de sécurité et configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080', 'http://127.0.0.1:8080'],
    credentials: true
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes API
const publicFormsRouter = require('./routes/public-forms');
app.use('/api/public/forms', publicFormsRouter);

// Routes principales (à implémenter)
app.use('/api/forms', require('./routes/forms'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/analytics', require('./routes/analytics'));

// Route de santé
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint non trouvé',
        path: req.originalUrl
    });
});

// Gestion globale des erreurs
app.use((error, req, res, next) => {
    console.error('Erreur serveur:', error);
    
    res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
        ...(process.env.NODE_ENV === 'development' && { 
            details: error.message,
            stack: error.stack 
        })
    });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur FormEase démarré sur le port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📋 API publique: http://localhost:${PORT}/api/public/forms/`);
    console.log(`📊 Analytics: http://localhost:${PORT}/api/analytics/`);
});

module.exports = app;
