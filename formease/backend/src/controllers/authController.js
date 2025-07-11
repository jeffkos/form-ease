// Contrôleur d'authentification pour FormEase
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// Inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
  try {
    // Validation déjà effectuée par le middleware
    const { first_name, last_name, email, password, language } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ 
        message: 'Un compte existe déjà avec cet email.',
        error: 'EMAIL_ALREADY_EXISTS'
      });
    }
    
    // Hash du mot de passe avec salt plus élevé pour la sécurité
    const password_hash = await bcrypt.hash(password, 12);
    
    // Création de l'utilisateur
    const user = await prisma.user.create({
      data: {
        first_name,
        last_name,
        email: email.toLowerCase(), // Normaliser l'email
        password_hash,
        role: 'USER', // Rôle par défaut conforme au schema
        language,
        plan: 'free',
      },
    });
    
    // Log de sécurité
    logger.info('New user registered', { 
      userId: user.id, 
      email: user.email, 
      ip: req.ip 
    });
    
    res.status(201).json({ 
      message: 'Compte créé avec succès', 
      user: { 
        id: user.id, 
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        plan: user.plan
      } 
    });
  } catch (error) {
    // Log d'erreur sécurisé
    logger.error('Registration error', { 
      error: error.message, 
      email: req.body?.email,
      ip: req.ip 
    });
    
    res.status(500).json({ 
      message: 'Erreur lors de la création du compte',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Connexion d'un utilisateur
exports.login = async (req, res) => {
  try {
    // Validation déjà effectuée par le middleware
    const { email, password } = req.body;
    
    // Recherche utilisateur avec email normalisé
    const user = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() } 
    });
    
    if (!user) {
      // Log de tentative de connexion échouée
      logger.warn('Login attempt with invalid email', { 
        email: email, 
        ip: req.ip 
      });
      
      return res.status(401).json({ 
        message: 'Email ou mot de passe incorrect.',
        error: 'INVALID_CREDENTIALS'
      });
    }
    
    // Vérification du mot de passe
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      // Log de tentative de connexion échouée
      logger.warn('Login attempt with invalid password', { 
        userId: user.id,
        email: user.email, 
        ip: req.ip 
      });
      
      return res.status(401).json({ 
        message: 'Email ou mot de passe incorrect.',
        error: 'INVALID_CREDENTIALS'
      });
    }
    
    // Génération du token JWT avec vérification du secret
    const jwt = require('jsonwebtoken');
    
    // Vérification critique du secret JWT
    if (!process.env.JWT_SECRET) {
      logger.error('CRITICAL: JWT_SECRET environment variable is missing');
      return res.status(500).json({ 
        message: 'Configuration serveur manquante',
        error: 'CONFIGURATION_ERROR'
      });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Log de connexion réussie
    logger.info('User login successful', { 
      userId: user.id, 
      email: user.email, 
      ip: req.ip 
    });
    
    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        language: user.language,
        plan: user.plan
      }
    });
  } catch (error) {
    // Log d'erreur sécurisé
    logger.error('Login error', { 
      error: error.message, 
      email: req.body?.email,
      ip: req.ip 
    });
    
    res.status(500).json({ 
      message: 'Erreur lors de la connexion',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Récupération du profil utilisateur (ajout du champ submissions_count)
exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        language: true,
        plan: true,
        plan_expiration: true,
        created_at: true
      }
    });
    
    if (!user) {
      logger.warn('Profile request for non-existent user', { 
        userId: req.user.id, 
        ip: req.ip 
      });
      return res.status(404).json({ 
        message: 'Utilisateur non trouvé',
        error: 'USER_NOT_FOUND'
      });
    }
    
    // Compter le nombre de formulaires et d'inscriptions
    const [formsCount, submissionsCount] = await Promise.all([
      prisma.form.count({ where: { user_id: user.id } }),
      prisma.submission.count({ where: { form: { user_id: user.id } } })
    ]);
    
    res.json({
      ...user,
      forms_count: formsCount,
      submissions_count: submissionsCount
    });
  } catch (error) {
    logger.error('Profile fetch error', { 
      error: error.message, 
      userId: req.user?.id,
      ip: req.ip 
    });
    
    res.status(500).json({ 
      message: 'Erreur lors de la récupération du profil',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Mise à jour du profil utilisateur
exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, email, password, language } = req.body;
    const data = { first_name, last_name, email, language };
    
    // Si un nouveau mot de passe est fourni, le hasher avec un salt plus élevé
    if (password) {
      data.password_hash = await bcrypt.hash(password, 12);
    }
    
    // Vérifier si l'email n'est pas déjà utilisé par un autre utilisateur
    if (email && email !== req.user.email) {
      const existingUser = await prisma.user.findUnique({ 
        where: { email: email.toLowerCase() } 
      });
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(409).json({ 
          message: 'Cet email est déjà utilisé par un autre compte',
          error: 'EMAIL_ALREADY_EXISTS'
        });
      }
      data.email = email.toLowerCase();
    }
    
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        language: true,
        plan: true,
        plan_expiration: true
      }
    });
    
    logger.info('Profile updated', { 
      userId: user.id, 
      email: user.email, 
      ip: req.ip 
    });
    
    res.json({ 
      message: 'Profil mis à jour avec succès', 
      user 
    });
  } catch (error) {
    logger.error('Profile update error', { 
      error: error.message, 
      userId: req.user?.id,
      ip: req.ip 
    });
    
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour du profil',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Rafraîchissement du token JWT
exports.refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'REFRESH_TOKEN_REQUIRED',
        message: 'Token de rafraîchissement requis'
      });
    }

    // Vérifier le refresh token dans la base de données
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refresh_token },
      include: { user: true }
    });

    if (!tokenRecord || tokenRecord.expires_at < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Token de rafraîchissement invalide ou expiré'
      });
    }

    // Générer un nouveau token d'accès
    const jwt = require('jsonwebtoken');
    const accessToken = jwt.sign(
      { 
        userId: tokenRecord.user.id, 
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
        plan: tokenRecord.user.plan
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Générer un nouveau refresh token
    const newRefreshToken = require('crypto').randomBytes(32).toString('hex');
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    // Mettre à jour le refresh token en base
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        token: newRefreshToken,
        expires_at: refreshExpiresAt
      }
    });

    logger.info('Token refreshed successfully', {
      userId: tokenRecord.user.id,
      ip: req.ip
    });

    res.json({
      success: true,
      token: accessToken,
      refresh_token: newRefreshToken,
      expires_in: 3600, // 1 heure en secondes
      user: {
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
        plan: tokenRecord.user.plan
      }
    });

  } catch (error) {
    logger.error('Token refresh error', {
      error: error.message,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Erreur lors du rafraîchissement du token'
    });
  }
};

// Déconnexion utilisateur
exports.logout = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    const userId = req.user?.id;

    // Si un refresh token est fourni, le supprimer de la base
    if (refresh_token) {
      await prisma.refreshToken.deleteMany({
        where: { 
          token: refresh_token,
          user_id: userId 
        }
      });
    }

    // Optionnel : Supprimer tous les refresh tokens de l'utilisateur
    if (req.body.logout_all_devices && userId) {
      await prisma.refreshToken.deleteMany({
        where: { user_id: userId }
      });
      
      logger.info('User logged out from all devices', {
        userId,
        ip: req.ip
      });
    } else {
      logger.info('User logged out', {
        userId,
        ip: req.ip
      });
    }

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    logger.error('Logout error', {
      error: error.message,
      userId: req.user?.id,
      ip: req.ip
    });

    // Même en cas d'erreur, on confirme la déconnexion côté client
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  }
};

// Révocation de tous les tokens d'un utilisateur (sécurité)
exports.revokeAllTokens = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Utilisateur non authentifié'
      });
    }

    // Supprimer tous les refresh tokens
    const deletedTokens = await prisma.refreshToken.deleteMany({
      where: { user_id: userId }
    });

    logger.warn('All tokens revoked for user', {
      userId,
      deletedCount: deletedTokens.count,
      ip: req.ip
    });

    res.json({
      success: true,
      message: `${deletedTokens.count} tokens révoqués avec succès`,
      revoked_tokens: deletedTokens.count
    });

  } catch (error) {
    logger.error('Token revocation error', {
      error: error.message,
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Erreur lors de la révocation des tokens'
    });
  }
};
