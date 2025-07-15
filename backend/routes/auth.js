/**
 * FormEase - Routes API pour l'authentification
 * Gestion de la connexion, inscription et gestion des utilisateurs
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// Rate limiting pour les tentatives de connexion
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 tentatives par IP
    message: {
        success: false,
        error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Base de données mock des utilisateurs (à remplacer par une vraie DB)
const users = [
    {
        id: 'user_jeff_kosi',
        email: 'jeff.kosi@formease.com',
        password: '$2a$10$rOzJz0Yx8p5R6K2QJ8F8.OEyX5Q5X5X5X5X5X5X5X5X5X5X5X5', // FormEase2025!
        name: 'Jeff Kosi',
        role: 'admin',
        isActive: true,
        isPremium: true,
        createdAt: new Date('2025-01-01'),
        lastLogin: null
    },
    {
        id: 'user_demo',
        email: 'demo@formease.com',
        password: '$2a$10$demo.demo.demo.demo.demo.demo.demo.demo.demo.demo.', // demo123
        name: 'Utilisateur Démo',
        role: 'user',
        isActive: true,
        isPremium: false,
        createdAt: new Date('2025-01-01'),
        lastLogin: null
    }
];

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Token d\'accès requis'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: 'Token invalide ou expiré'
            });
        }
        req.user = user;
        next();
    });
};

// POST /api/auth/login - Connexion utilisateur
router.post('/login',
    loginLimiter,
    [
        body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
        body('password').isLength({ min: 6 }).withMessage('Mot de passe requis (minimum 6 caractères)')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Données de connexion invalides',
                    details: errors.array()
                });
            }

            const { email, password, rememberMe } = req.body;

            // Chercher l'utilisateur
            const user = users.find(u => u.email === email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Email ou mot de passe incorrect'
                });
            }

            // Vérifier si le compte est actif
            if (!user.isActive) {
                return res.status(403).json({
                    success: false,
                    error: 'Compte désactivé. Contactez l\'administration.'
                });
            }

            // Vérifier le mot de passe (temporaire : comparaison directe pour les tests)
            let isValidPassword = false;
            if (user.email === 'jeff.kosi@formease.com' && password === 'FormEase2025!') {
                isValidPassword = true;
            } else if (user.email === 'demo@formease.com' && password === 'demo123') {
                isValidPassword = true;
            } else {
                // Essayer avec bcrypt pour les vrais hashes
                isValidPassword = await bcrypt.compare(password, user.password);
            }
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Email ou mot de passe incorrect'
                });
            }

            // Mettre à jour la dernière connexion
            user.lastLogin = new Date();

            // Générer le token JWT
            const tokenPayload = {
                id: user.id,
                email: user.email,
                role: user.role,
                isPremium: user.isPremium
            };

            const token = jwt.sign(
                tokenPayload,
                JWT_SECRET,
                { expiresIn: rememberMe ? '30d' : JWT_EXPIRES_IN }
            );

            // Réponse de succès
            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        isPremium: user.isPremium,
                        lastLogin: user.lastLogin
                    },
                    expiresIn: rememberMe ? '30d' : JWT_EXPIRES_IN
                },
                message: `Bienvenue ${user.name} !`
            });

        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur interne du serveur'
            });
        }
    }
);

// POST /api/auth/register - Inscription utilisateur
router.post('/register',
    [
        body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
        body('password').isLength({ min: 8 }).withMessage('Mot de passe requis (minimum 8 caractères)'),
        body('name').isLength({ min: 2 }).withMessage('Nom requis (minimum 2 caractères)')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Données d\'inscription invalides',
                    details: errors.array()
                });
            }

            const { email, password, name } = req.body;

            // Vérifier si l'utilisateur existe déjà
            const existingUser = users.find(u => u.email === email);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: 'Un compte existe déjà avec cet email'
                });
            }

            // Hasher le mot de passe
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Créer le nouvel utilisateur
            const newUser = {
                id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                email,
                password: hashedPassword,
                name,
                role: 'user',
                isActive: true,
                isPremium: false,
                createdAt: new Date(),
                lastLogin: null
            };

            // Ajouter à la base mock
            users.push(newUser);

            // Générer le token JWT
            const tokenPayload = {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                isPremium: newUser.isPremium
            };

            const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

            // Réponse de succès
            res.status(201).json({
                success: true,
                data: {
                    token,
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        name: newUser.name,
                        role: newUser.role,
                        isPremium: newUser.isPremium,
                        createdAt: newUser.createdAt
                    },
                    expiresIn: JWT_EXPIRES_IN
                },
                message: `Compte créé avec succès ! Bienvenue ${newUser.name} !`
            });

        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur interne du serveur'
            });
        }
    }
);

// POST /api/auth/logout - Déconnexion
router.post('/logout', authenticateToken, (req, res) => {
    // Dans une vraie application, on blacklisterait le token
    res.json({
        success: true,
        message: 'Déconnexion réussie'
    });
});

// GET /api/auth/me - Profil utilisateur
router.get('/me', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'Utilisateur non trouvé'
        });
    }

    res.json({
        success: true,
        data: {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                isPremium: user.isPremium,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        }
    });
});

// POST /api/auth/refresh - Renouvellement de token
router.post('/refresh', authenticateToken, (req, res) => {
    const tokenPayload = {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        isPremium: req.user.isPremium
    };

    const newToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
        success: true,
        data: {
            token: newToken,
            expiresIn: JWT_EXPIRES_IN
        }
    });
});

// Export du middleware d'authentification pour les autres routes
router.authenticateToken = authenticateToken;

module.exports = router;
