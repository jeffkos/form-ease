// Contrôleur des formulaires pour FormEase
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const prisma = new PrismaClient();

// Créer un formulaire (limite Freemium)
exports.createForm = async (req, res) => {
  try {
    // Vérifier la limite Freemium
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { forms: true }
    });
    
    if (user.plan === 'free' && user.forms.length >= 1) {
      return res.status(403).json({ 
        message: 'Limite de formulaire atteinte (offre gratuite).',
        error: 'PLAN_LIMIT_EXCEEDED'
      });
    }
    
    const { title, description, fields, settings } = req.body;
    
    const form = await prisma.form.create({
      data: {
        user_id: req.user.id,
        title,
        description: description || '',
        config: {
          fields: fields || [],
          settings: settings || {}
        },
        active: true
      }
    });
    
    logger.info('Form created', { 
      formId: form.id, 
      userId: req.user.id, 
      title, 
      ip: req.ip 
    });
    
    res.status(201).json({ 
      message: 'Formulaire créé avec succès', 
      form 
    });
  } catch (error) {
    logger.error('Form creation error', { 
      error: error.message, 
      userId: req.user?.id,
      ip: req.ip 
    });
    
    res.status(500).json({ 
      message: 'Erreur lors de la création du formulaire',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Récupérer un formulaire spécifique
exports.getForm = async (req, res) => {
  try {
    const { id } = req.params;
    
    const form = await prisma.form.findUnique({
      where: { 
        id: parseInt(id),
        user_id: req.user.id // S'assurer que l'utilisateur est propriétaire
      },
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    });
    
    if (!form) {
      return res.status(404).json({ 
        message: 'Formulaire non trouvé',
        error: 'FORM_NOT_FOUND'
      });
    }
    
    res.json({ form });
  } catch (error) {
    logger.error('Form fetch error', { 
      error: error.message, 
      formId: req.params.id,
      userId: req.user?.id,
      ip: req.ip 
    });
    
    res.status(500).json({ 
      message: 'Erreur lors de la récupération du formulaire',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Mettre à jour un formulaire
exports.updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, fields, settings, active } = req.body;
    
    // Vérifier que le formulaire existe et appartient à l'utilisateur
    const existingForm = await prisma.form.findUnique({
      where: { 
        id: parseInt(id),
        user_id: req.user.id
      }
    });
    
    if (!existingForm) {
      return res.status(404).json({ 
        message: 'Formulaire non trouvé',
        error: 'FORM_NOT_FOUND'
      });
    }
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (active !== undefined) updateData.active = active;
    
    if (fields !== undefined || settings !== undefined) {
      updateData.config = {
        fields: fields || existingForm.config.fields || [],
        settings: settings || existingForm.config.settings || {}
      };
    }
    
    const form = await prisma.form.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    logger.info('Form updated', { 
      formId: form.id, 
      userId: req.user.id, 
      ip: req.ip 
    });
    
    res.json({ 
      message: 'Formulaire mis à jour avec succès', 
      form 
    });
  } catch (error) {
    logger.error('Form update error', { 
      error: error.message, 
      formId: req.params.id,
      userId: req.user?.id,
      ip: req.ip 
    });
    
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour du formulaire',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Supprimer un formulaire
exports.deleteForm = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que le formulaire existe et appartient à l'utilisateur
    const existingForm = await prisma.form.findUnique({
      where: { 
        id: parseInt(id),
        user_id: req.user.id
      },
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    });
    
    if (!existingForm) {
      return res.status(404).json({ 
        message: 'Formulaire non trouvé',
        error: 'FORM_NOT_FOUND'
      });
    }
    
    // Supprimer le formulaire et toutes ses soumissions (cascade)
    await prisma.form.delete({
      where: { id: parseInt(id) }
    });
    
    logger.info('Form deleted', { 
      formId: parseInt(id), 
      userId: req.user.id, 
      submissionsCount: existingForm._count.submissions,
      ip: req.ip 
    });
    
    res.json({ 
      message: 'Formulaire supprimé avec succès',
      deletedSubmissions: existingForm._count.submissions
    });
  } catch (error) {
    logger.error('Form deletion error', { 
      error: error.message, 
      formId: req.params.id,
      userId: req.user?.id,
      ip: req.ip 
    });
    
    res.status(500).json({ 
      message: 'Erreur lors de la suppression du formulaire',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Lister les formulaires de l'utilisateur avec pagination
exports.listForms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 20;
    const skip = (page - 1) * limit;
    
    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where: { user_id: req.user.id },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { submissions: true }
          }
        }
      }),
      prisma.form.count({ where: { user_id: req.user.id } })
    ]);
    
    logger.info('Forms listed', { 
      userId: req.user.id, 
      count: forms.length,
      page,
      ip: req.ip 
    });
    
    res.json({ forms, page, limit, total });
  } catch (error) {
    logger.error('Forms list error', { 
      error: error.message, 
      userId: req.user?.id,
      ip: req.ip 
    });
    
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des formulaires',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Soumettre une inscription (limite Freemium)
exports.submit = async (req, res) => {
  try {
    const { formId } = req.params;
    const { data } = req.body;
    
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ 
        message: 'Données du formulaire requises',
        error: 'INVALID_DATA'
      });
    }
    
    // Vérifier la limite d'inscrits pour le propriétaire du formulaire
    const form = await prisma.form.findUnique({
      where: { id: parseInt(formId) },
      include: { 
        user: true, 
        _count: { select: { submissions: true } }
      }
    });
    
    if (!form) {
      return res.status(404).json({ 
        message: 'Formulaire introuvable',
        error: 'FORM_NOT_FOUND'
      });
    }
    
    if (!form.active) {
      return res.status(403).json({ 
        message: 'Ce formulaire n\'est plus actif',
        error: 'FORM_INACTIVE'
      });
    }
    
    if (form.user.plan === 'free' && form._count.submissions >= 100) {
      return res.status(403).json({ 
        message: 'Limite d\'inscrits atteinte (offre gratuite)',
        error: 'PLAN_LIMIT_EXCEEDED'
      });
    }
    
    const submission = await prisma.submission.create({
      data: {
        form_id: parseInt(formId),
        data,
        status: 'new'
      }
    });
    
    logger.info('Form submission created', { 
      submissionId: submission.id,
      formId: parseInt(formId), 
      ip: req.ip 
    });
    
    res.status(201).json({ 
      message: 'Inscription enregistrée avec succès', 
      submission: {
        id: submission.id,
        created_at: submission.created_at,
        status: submission.status
      }
    });
  } catch (error) {
    logger.error('Form submission error', { 
      error: error.message, 
      formId: req.params?.formId,
      ip: req.ip 
    });
    
    res.status(500).json({ 
      message: 'Erreur lors de l\'enregistrement',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Lister les inscrits d'un formulaire avec pagination et champs dynamiques
exports.listSubmissions = async (req, res) => {
  try {
    const { formId } = req.params;
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 100;
    const skip = (page - 1) * limit;
    // Récupérer le total des soumissions pour la pagination
    const total = await prisma.submission.count({ where: { form_id: parseInt(formId) } });
    // Récupérer uniquement la page courante
    const submissions = await prisma.submission.findMany({
      where: { form_id: parseInt(formId) },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit
    });
    // Champs dynamiques détectés sur la page courante (plus rapide)
    const allFields = Array.from(new Set(submissions.flatMap(s => Object.keys(s.data))));
    res.json({ submissions, page, limit, total, fields: allFields });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
