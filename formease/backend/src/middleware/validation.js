// Middleware de validation centralisé pour FormEase
const { body, param, query, validationResult } = require('express-validator');
const Joi = require('joi');
const logger = require('../utils/logger');

// Middleware pour traiter les résultats de validation express-validator
const validateRequest = (validations) => {
  return async (req, res, next) => {
    // Exécuter toutes les validations
    if (Array.isArray(validations)) {
      await Promise.all(validations.map(validation => validation.run(req)));
    } else if (typeof validations === 'function') {
      await validations.run(req);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Log des erreurs de validation pour la sécurité
      logger.warn('Validation failed', {
        errors: errors.array(),
        ip: req.ip,
        endpoint: req.originalUrl,
        method: req.method
      });

      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Données invalides',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }))
      });
    }
    next();
  };
};

// Legacy function pour compatibilité avec les tests existants
const validate = (type) => {
  const validationMap = {
    'register': registerValidation,
    'login': loginValidation,
    'updateProfile': updateProfileValidation,
    'createForm': createFormValidation,
    'updateForm': updateFormValidation
  };
  
  const validations = validationMap[type];
  if (!validations) {
    throw new Error(`Unknown validation type: ${type}`);
  }
  
  // Return a middleware function that runs validation synchronously for tests
  return async (req, res, next) => {
    try {
      // Execute all validations
      await Promise.all(validations.map(validation => validation.run(req)));
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Log des erreurs de validation pour la sécurité
        logger.warn('Validation failed', {
          errors: errors.array(),
          ip: req.ip,
          endpoint: req.originalUrl,
          method: req.method
        });

        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Données invalides',
          errors: errors.array().map(err => ({
            field: err.path,
            message: err.msg,
            value: err.value
          }))
        });
      }
      
      // Strip unknown fields for security (only for register type)
      if (type === 'register') {
        const allowedFields = ['first_name', 'last_name', 'email', 'password', 'language'];
        const cleanedBody = {};
        allowedFields.forEach(field => {
          if (req.body[field] !== undefined) {
            cleanedBody[field] = req.body[field];
          }
        });
        req.body = cleanedBody;
      }
      
      next();
    } catch (error) {
      logger.error('Validation error', { error: error.message });
      return res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur de validation'
      });
    }
  };
};

// Validation d'ID générique (compatible avec les tests)
const validateId = (req, res, next) => {
  const id = req.params.id;
  
  if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'ID invalide'
    });
  }
  
  req.params.id = parseInt(id);
  next();
};

// Middleware pour validation Joi (alternative)
const validateJoi = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      logger.warn('Joi validation failed', {
        error: error.details,
        ip: req.ip,
        endpoint: req.originalUrl
      });

      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Données invalides',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }))
      });
    }
    next();
  };
};

// ========== VALIDATIONS AUTH ==========

// Validation pour l'inscription
const registerValidation = [
  body('first_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Le prénom ne peut contenir que des lettres, espaces, apostrophes et tirets'),
  
  body('last_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('L\'email ne peut pas dépasser 100 caractères'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Le mot de passe doit contenir entre 8 et 128 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'),
  
  body('language')
    .optional()
    .customSanitizer(value => value ? value.toLowerCase() : value)
    .isIn(['fr', 'en', 'es', 'de'])
    .withMessage('Langue non supportée')
];

// Validation pour la connexion
const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('L\'email ne peut pas dépasser 100 caractères'),
  
  body('password')
    .isLength({ min: 1, max: 128 })
    .withMessage('Mot de passe requis')
];

// Validation pour la mise à jour du profil
const updateProfileValidation = [
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Le prénom ne peut contenir que des lettres, espaces, apostrophes et tirets'),
  
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('L\'email ne peut pas dépasser 100 caractères'),
  
  body('password')
    .optional()
    .isLength({ min: 8, max: 128 })
    .withMessage('Le mot de passe doit contenir entre 8 et 128 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'),
  
  body('language')
    .optional()
    .customSanitizer(value => value ? value.toLowerCase() : value)
    .isIn(['fr', 'en', 'es', 'de'])
    .withMessage('Langue non supportée')
];

// ========== VALIDATIONS FORMULAIRES ==========

// Validation pour la création de formulaire
const createFormValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Le titre doit contenir entre 1 et 200 caractères')
    .escape(),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La description ne peut pas dépasser 1000 caractères')
    .escape(),
  
  body('fields')
    .isArray({ min: 1 })
    .withMessage('Le formulaire doit contenir au moins un champ'),
  
  body('fields.*.type')
    .isIn(['text', 'email', 'number', 'textarea', 'select', 'radio', 'checkbox', 'date', 'file'])
    .withMessage('Type de champ invalide'),
  
  body('fields.*.label')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Le label du champ doit contenir entre 1 et 100 caractères')
    .escape(),
  
  body('fields.*.required')
    .optional()
    .isBoolean()
    .withMessage('La propriété required doit être un booléen'),
  
  body('fields.*.options')
    .optional()
    .isArray()
    .withMessage('Les options doivent être un tableau'),
  
  body('settings.allow_multiple_submissions')
    .optional()
    .isBoolean()
    .withMessage('allow_multiple_submissions doit être un booléen'),
  
  body('settings.email_notifications')
    .optional()
    .isBoolean()
    .withMessage('email_notifications doit être un booléen'),
  
  body('settings.store_submissions')
    .optional()
    .isBoolean()
    .withMessage('store_submissions doit être un booléen')
];

// Validation pour la mise à jour de formulaire
const updateFormValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de formulaire invalide'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Le titre doit contenir entre 1 et 200 caractères')
    .escape(),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La description ne peut pas dépasser 1000 caractères')
    .escape(),
  
  body('fields')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Le formulaire doit contenir au moins un champ'),
  
  body('active')
    .optional()
    .isBoolean()
    .withMessage('active doit être un booléen')
];

// ========== VALIDATIONS SUBMISSIONS ==========

// Validation pour les soumissions de formulaire
const submitFormValidation = [
  param('formId')
    .isInt({ min: 1 })
    .withMessage('ID de formulaire invalide'),
  
  body('data')
    .isObject()
    .withMessage('Les données doivent être un objet'),
  
  // Validation dynamique des données basée sur le formulaire
  // Cette validation sera complétée côté contrôleur
];

// ========== VALIDATIONS GENERIQUES ==========

// Validation pour la pagination
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être un entier positif'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
  
  query('sortBy')
    .optional()
    .isIn(['created_at', 'updated_at', 'title', 'email'])
    .withMessage('Champ de tri invalide'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Ordre de tri invalide (asc ou desc)')
];

// ========== SCHEMAS JOI (ALTERNATIVE) ==========

// Schema Joi pour l'inscription
const registerJoiSchema = Joi.object({
  first_name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .required()
    .messages({
      'string.min': 'Le prénom doit contenir au moins 2 caractères',
      'string.max': 'Le prénom ne peut pas dépasser 50 caractères',
      'string.pattern.base': 'Le prénom ne peut contenir que des lettres, espaces, apostrophes et tirets'
    }),
  
  last_name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .required()
    .messages({
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 50 caractères',
      'string.pattern.base': 'Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets'
    }),
  
  email: Joi.string()
    .email()
    .max(100)
    .required()
    .messages({
      'string.email': 'Format d\'email invalide',
      'string.max': 'L\'email ne peut pas dépasser 100 caractères'
    }),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
      'string.max': 'Le mot de passe ne peut pas dépasser 128 caractères',
      'string.pattern.base': 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'
    }),
  
  language: Joi.string()
    .valid('fr', 'en', 'es', 'de')
    .optional()
    .messages({
      'any.only': 'Langue non supportée'
    })
});

// Schema pour connexion
const loginJoiSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required()
});

// Schema pour création de formulaire
const createFormJoiSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).optional(),
  config: Joi.object().required()
});

// Regroupement des schemas pour les tests
const schemas = {
  login: loginJoiSchema,
  createForm: createFormJoiSchema,
  register: registerJoiSchema
};

// Middleware de sanitisation HTML
const sanitizeHtml = (fields) => {
  return (req, res, next) => {
    fields.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        // Échapper les caractères HTML dangereux
        req.body[field] = req.body[field]
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      }
    });
    next();
  };
};

// Middleware de validation de fichiers
const validateFileUpload = (options = {}) => {
  const { 
    maxSize = 5 * 1024 * 1024, // 5MB par défaut
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    required = false
  } = options;

  return (req, res, next) => {
    if (!req.file && required) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Fichier requis'
      });
    }

    if (req.file) {
      // Vérifier la taille
      if (req.file.size > maxSize) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: `Fichier trop volumineux. Taille maximum: ${maxSize / 1024 / 1024}MB`
        });
      }

      // Vérifier le type
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`
        });
      }

      // Log de sécurité pour les uploads
      logger.info('File upload validation passed', {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        ip: req.ip
      });
    }

    next();
  };
};

module.exports = {
  validate, // Legacy function for tests
  validateRequest,
  validateId, // Legacy function for tests
  validateJoi,
  registerValidation,
  loginValidation,
  updateProfileValidation,
  createFormValidation,
  updateFormValidation,
  submitFormValidation,
  paginationValidation,
  registerJoiSchema,
  schemas, // For tests
  sanitizeHtml,
  validateFileUpload
};
