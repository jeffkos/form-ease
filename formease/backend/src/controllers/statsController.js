// Contrôleur des statistiques pour le dashboard FormEase
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Statistiques globales (admin) avec pagination sur les utilisateurs
exports.getOverviewStats = async (req, res) => {
  try {
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 100;
    const skip = (page - 1) * limit;
    const [userCount, formCount, submissionCount, premiumCount, users] = await Promise.all([
      prisma.user.count(),
      prisma.form.count(),
      prisma.submission.count(),
      prisma.user.count({ where: { plan: 'premium' } }),
      prisma.user.findMany({ skip, take: limit, orderBy: { created_at: 'desc' }, select: { id: true, email: true, plan: true, created_at: true } })
    ]);
    res.json({
      users,
      usersTotal: userCount,
      forms: formCount,
      submissions: submissionCount,
      premiumUsers: premiumCount,
      page,
      limit
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur stats overview', error: error.message });
  }
};

// Statistiques par utilisateur (dashboard utilisateur)
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const [formCount, submissionCount] = await Promise.all([
      prisma.form.count({ where: { user_id: userId } }),
      prisma.submission.count({ where: { form: { user_id: userId } } })
    ]);
    res.json({
      forms: formCount,
      submissions: submissionCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur stats utilisateur', error: error.message });
  }
};

// Statistiques d'inscriptions par période (ex: 30 derniers jours)
exports.getSubmissionsByPeriod = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));
    const count = await prisma.submission.count({
      where: { created_at: { gte: since } }
    });
    res.json({ submissions: count, since });
  } catch (error) {
    res.status(500).json({ message: 'Erreur stats période', error: error.message });
  }
};

// Statistiques par formulaire (nombre de soumissions par formulaire) avec pagination
exports.getFormStats = async (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? undefined : req.user.id;
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 100;
    const skip = (page - 1) * limit;
    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where: userId ? { user_id: userId } : {},
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          submissions: { select: { id: true, status: true, created_at: true } }
        }
      }),
      prisma.form.count({ where: userId ? { user_id: userId } : {} })
    ]);
    const stats = forms.map(f => ({
      formId: f.id,
      title: f.title,
      total: f.submissions.length,
      validated: f.submissions.filter(s => s.status === 'validated').length,
      pending: f.submissions.filter(s => s.status === 'pending').length,
      trashed: f.submissions.filter(s => s.status === 'trashed').length
    }));
    res.json({ stats, page, limit, total });
  } catch (error) {
    res.status(500).json({ message: 'Erreur stats formulaires', error: error.message });
  }
};

// Evolution des soumissions (par jour sur 30 jours)
exports.getSubmissionsEvolution = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));
    const submissions = await prisma.submission.findMany({
      where: { created_at: { gte: since } },
      select: { created_at: true }
    });
    // Regroupement par jour
    const evolution = {};
    submissions.forEach(s => {
      const d = s.created_at.toISOString().slice(0, 10);
      evolution[d] = (evolution[d] || 0) + 1;
    });
    res.json(evolution);
  } catch (error) {
    res.status(500).json({ message: 'Erreur évolution soumissions', error: error.message });
  }
};

// Stats par plan utilisateur
exports.getPlanStats = async (req, res) => {
  try {
    const [freemium, premium] = await Promise.all([
      prisma.user.count({ where: { plan: 'freemium' } }),
      prisma.user.count({ where: { plan: 'premium' } })
    ]);
    res.json({ freemium, premium });
  } catch (error) {
    res.status(500).json({ message: 'Erreur stats plans', error: error.message });
  }
};

// Statistiques par champ (distribution des réponses pour un champ donné)
exports.getFieldStats = async (req, res) => {
  try {
    const { fieldName, formId, start, end } = req.query;
    if (!fieldName) return res.status(400).json({ message: 'Champ fieldName requis' });
    const where = { };
    if (formId) where.form_id = parseInt(formId);
    if (start || end) {
      where.created_at = {};
      if (start) where.created_at.gte = new Date(start);
      if (end) where.created_at.lte = new Date(end);
    }
    const submissions = await prisma.submission.findMany({ where });
    const distribution = {};
    submissions.forEach(s => {
      const val = s.data[fieldName];
      if (val !== undefined) distribution[val] = (distribution[val] || 0) + 1;
    });
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ message: 'Erreur stats champ', error: error.message });
  }
};

// Statistiques sur une période personnalisée (tous types)
exports.getStatsByPeriod = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ message: 'start et end requis' });
    const [submissions, forms, users] = await Promise.all([
      prisma.submission.count({ where: { created_at: { gte: new Date(start), lte: new Date(end) } } }),
      prisma.form.count({ where: { created_at: { gte: new Date(start), lte: new Date(end) } } }),
      prisma.user.count({ where: { created_at: { gte: new Date(start), lte: new Date(end) } } })
    ]);
    res.json({ submissions, forms, users });
  } catch (error) {
    res.status(500).json({ message: 'Erreur stats période personnalisée', error: error.message });
  }
};

// Top utilisateurs (par nombre de formulaires ou de soumissions reçues)
exports.getTopUsers = async (req, res) => {
  try {
    const { by = 'forms', limit = 5 } = req.query;
    if (by === 'forms') {
      const top = await prisma.user.findMany({
        take: parseInt(limit),
        orderBy: { forms: { _count: 'desc' } },
        select: { id: true, email: true, forms: { select: { id: true } } }
      });
      res.json(top.map(u => ({ userId: u.id, email: u.email, forms: u.forms.length })));
    } else if (by === 'submissions') {
      const top = await prisma.user.findMany({
        take: parseInt(limit),
        orderBy: { submissions: { _count: 'desc' } },
        select: { id: true, email: true, submissions: { select: { id: true } } }
      });
      res.json(top.map(u => ({ userId: u.id, email: u.email, submissions: u.submissions.length })));
    } else {
      res.status(400).json({ message: 'Paramètre by invalide' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur top utilisateurs', error: error.message });
  }
};
