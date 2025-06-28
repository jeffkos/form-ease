// Contrôleur des formulaires pour FormEase
const { PrismaClient } = require('@prisma/client');
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
      return res.status(403).json({ message: 'Limite de formulaire atteinte (offre gratuite).' });
    }
    const { title, description, config } = req.body;
    if (!title || !config) {
      return res.status(400).json({ message: 'Titre et configuration requis.' });
    }
    const form = await prisma.form.create({
      data: {
        user_id: req.user.id,
        title,
        description: description || '',
        config,
      }
    });
    res.status(201).json({ message: 'Formulaire créé', form });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
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
        take: limit
      }),
      prisma.form.count({ where: { user_id: req.user.id } })
    ]);
    res.json({ forms, page, limit, total });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Soumettre une inscription (limite Freemium)
exports.submit = async (req, res) => {
  try {
    const { formId, data } = req.body;
    if (!formId || !data) {
      return res.status(400).json({ message: 'formId et data requis.' });
    }
    // Vérifier la limite d'inscrits pour le propriétaire du formulaire
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: { user: true, submissions: true }
    });
    if (!form) return res.status(404).json({ message: 'Formulaire introuvable.' });
    if (form.user.plan === 'free' && form.submissions.length >= 100) {
      return res.status(403).json({ message: 'Limite d’inscrits atteinte (offre gratuite).' });
    }
    const submission = await prisma.submission.create({
      data: {
        form_id: formId,
        data,
        status: 'new'
      }
    });
    res.status(201).json({ message: 'Inscription enregistrée', submission });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
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
