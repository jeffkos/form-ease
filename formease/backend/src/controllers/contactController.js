const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');
const Joi = require('joi');

// Validation schemas
const contactSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().max(20).optional(),
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().min(1).max(100).required(),
  city: Joi.string().max(100).optional(),
  country: Joi.string().max(100).optional(),
  tags: Joi.alternatives().try(
    Joi.string().max(500),
    Joi.array().items(Joi.string().max(100))
  ).optional(),
  source_form_id: Joi.number().integer().optional()
});

const contactUpdateSchema = contactSchema.keys({
  email: Joi.string().email().optional(),
  first_name: Joi.string().min(1).max(100).optional(),
  last_name: Joi.string().min(1).max(100).optional()
});

const querySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
  search: Joi.string().max(200).optional()
});

// Liste des contacts de l'utilisateur
exports.getContacts = async (req, res) => {
  try {
    // Validation des paramètres de requête
    const { error, value } = querySchema.validate(req.query);
    if (error) {
      logger.warn('Invalid query parameters for contacts list', {
        error: error.details,
        query: req.query,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        error: 'Paramètres de requête invalides',
        details: error.details.map(d => d.message)
      });
    }

    const { limit, offset, search } = value;
    
    // Construction de la clause WHERE pour la recherche
    const where = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Récupération avec pagination
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.contact.count({ where })
    ]);

    logger.info('Contacts retrieved successfully', {
      count: contacts.length,
      total,
      search,
      pagination: { limit, offset },
      timestamp: new Date().toISOString()
    });

    res.json({
      contacts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    logger.error('Error retrieving contacts', {
      error: error.message,
      stack: error.stack,
      query: req.query,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des contacts', 
      message: 'Une erreur interne est survenue'
    });
  }
};

// Création d'un contact
exports.createContact = async (req, res) => {
  try {
    // Validation des données
    const { error, value } = contactSchema.validate(req.body);
    if (error) {
      logger.warn('Validation error on contact creation', {
        error: error.details,
        body: req.body,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        error: 'Données invalides',
        details: error.details.map(d => d.message)
      });
    }

    // Vérifier si le contact existe déjà
    const existingContact = await prisma.contact.findUnique({
      where: { email: value.email }
    });

    if (existingContact) {
      logger.warn('Contact with email already exists', {
        email: value.email,
        existingId: existingContact.id,
        timestamp: new Date().toISOString()
      });
      return res.status(409).json({
        error: 'Un contact avec cet email existe déjà',
        existing: existingContact
      });
    }

    // Création du contact
    const contact = await prisma.contact.create({
      data: value
    });

    logger.info('Contact created successfully', {
      contactId: contact.id,
      email: contact.email,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(contact);

  } catch (error) {
    logger.error('Error creating contact', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      error: 'Erreur lors de la création du contact', 
      message: 'Une erreur interne est survenue'
    });
  }
};

// Mise à jour d'un contact
exports.updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contactId = parseInt(id);

    if (isNaN(contactId)) {
      return res.status(400).json({ error: 'ID de contact invalide' });
    }

    // Validation des données
    const { error, value } = contactUpdateSchema.validate(req.body);
    if (error) {
      logger.warn('Validation error on contact update', {
        error: error.details,
        contactId,
        body: req.body,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        error: 'Données invalides',
        details: error.details.map(d => d.message)
      });
    }

    // Vérifier si le contact existe
    const existingContact = await prisma.contact.findUnique({
      where: { id: contactId }
    });

    if (!existingContact) {
      logger.warn('Contact not found for update', {
        contactId,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({ error: 'Contact non trouvé' });
    }

    // Vérifier si l'email est déjà utilisé par un autre contact
    if (value.email && value.email !== existingContact.email) {
      const emailConflict = await prisma.contact.findUnique({
        where: { email: value.email }
      });

      if (emailConflict) {
        logger.warn('Email conflict on contact update', {
          contactId,
          newEmail: value.email,
          conflictId: emailConflict.id,
          timestamp: new Date().toISOString()
        });
        return res.status(409).json({
          error: 'Cet email est déjà utilisé par un autre contact'
        });
      }
    }

    // Mise à jour du contact
    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: value
    });

    logger.info('Contact updated successfully', {
      contactId: contact.id,
      changes: Object.keys(value),
      timestamp: new Date().toISOString()
    });

    res.json(contact);

  } catch (error) {
    logger.error('Error updating contact', {
      error: error.message,
      stack: error.stack,
      contactId: req.params.id,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour du contact', 
      message: 'Une erreur interne est survenue'
    });
  }
};

// Suppression d'un contact
exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contactId = parseInt(id);

    if (isNaN(contactId)) {
      return res.status(400).json({ error: 'ID de contact invalide' });
    }

    // Vérifier si le contact existe
    const existingContact = await prisma.contact.findUnique({
      where: { id: contactId }
    });

    if (!existingContact) {
      logger.warn('Contact not found for deletion', {
        contactId,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({ error: 'Contact non trouvé' });
    }

    // Suppression du contact
    await prisma.contact.delete({ 
      where: { id: contactId } 
    });

    logger.info('Contact deleted successfully', {
      contactId,
      email: existingContact.email,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: 'Contact supprimé avec succès' 
    });

  } catch (error) {
    logger.error('Error deleting contact', {
      error: error.message,
      stack: error.stack,
      contactId: req.params.id,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du contact', 
      message: 'Une erreur interne est survenue'
    });
  }
};
