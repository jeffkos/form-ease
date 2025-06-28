// Middleware de validation centralisé avec Joi
const Joi = require('joi');

// Schémas de validation
const schemas = {
  register: Joi.object({
    first_name: Joi.string().alphanum().min(2).max(50).required()
      .messages({
        'string.alphanum': 'Le prénom ne peut contenir que des lettres et chiffres',
        'string.min': 'Le prénom doit contenir au moins 2 caractères',
        'string.max': 'Le prénom ne peut dépasser 50 caractères'
      }),
    last_name: Joi.string().alphanum().min(2).max(50).required()
      .messages({
        'string.alphanum': 'Le nom ne peut contenir que des lettres et chiffres',
        'string.min': 'Le nom doit contenir au moins 2 caractères',
        'string.max': 'Le nom ne peut dépasser 50 caractères'
      }),
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Format d\'email invalide'
      }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
        'string.pattern.base': 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'
      }),
    language: Joi.string().valid('FR', 'EN').required()
      .messages({
        'any.only': 'La langue doit être FR ou EN'
      })
  }),

  login: Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Format d\'email invalide'
      }),
    password: Joi.string().required()
      .messages({
        'string.empty': 'Le mot de passe est requis'
      })
  }),

  createForm: Joi.object({
    title: Joi.string().min(3).max(100).required()
      .messages({
        'string.min': 'Le titre doit contenir au moins 3 caractères',
        'string.max': 'Le titre ne peut dépasser 100 caractères'
      }),
    description: Joi.string().min(10).max(500).required()
      .messages({
        'string.min': 'La description doit contenir au moins 10 caractères',
        'string.max': 'La description ne peut dépasser 500 caractères'
      }),
    config: Joi.object().required()
      .messages({
        'object.required': 'La configuration du formulaire est requise'
      })
  }),

  updateProfile: Joi.object({
    first_name: Joi.string().alphanum().min(2).max(50).optional(),
    last_name: Joi.string().alphanum().min(2).max(50).optional(),
    email: Joi.string().email().optional(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .optional(),
    language: Joi.string().valid('FR', 'EN').optional()
  })
};

// Middleware de validation
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      return res.status(500).json({ 
        message: 'Schéma de validation non trouvé',
        error: `Schema '${schemaName}' does not exist`
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Retourner toutes les erreurs
      allowUnknown: false, // Interdire les champs non définis
      stripUnknown: true // Supprimer les champs non autorisés
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(400).json({
        message: 'Données invalides',
        errors: validationErrors
      });
    }

    // Remplacer req.body par les données validées et nettoyées
    req.body = value;
    next();
  };
};

// Validation spécifique pour les IDs
const validateId = (req, res, next) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      message: 'ID invalide',
      error: 'L\'ID doit être un nombre entier positif'
    });
  }
  
  req.params.id = id;
  next();
};

module.exports = {
  validate,
  validateId,
  schemas
};
