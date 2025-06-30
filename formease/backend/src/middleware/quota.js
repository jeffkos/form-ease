// Middleware de quotas pour FormEase
// Vérifie les limites selon le plan utilisateur (freemium/premium)
const { PrismaClient } = require('@prisma/client');

// Function to get Prisma instance (mockable for tests)
const getPrismaInstance = () => {
  if (global.mockPrisma) {
    return global.mockPrisma;
  }
  return new PrismaClient();
};

const prisma = getPrismaInstance();

const QUOTAS = {
  free: {
    forms: 1,
    submissionsPerForm: 100,
    exportsPerDay: 5
  },
  premium: {
    forms: 100,
    submissionsPerForm: 10000,
    exportsPerDay: 100
  }
};

async function getUserPlan(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.plan || 'free';
}

// Vérifie le quota de formulaires
exports.checkFormQuota = async (req, res, next) => {
  try {
    const plan = await getUserPlan(req.user.id);
    const count = await prisma.form.count({ where: { user_id: req.user.id } });
    if (count >= QUOTAS[plan].forms) {
      return res.status(403).json({ message: 'Limite de formulaires atteinte pour votre offre.' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la vérification du quota.' });
  }
};

// Vérifie le quota d'inscriptions par formulaire (route publique)
exports.checkSubmissionQuota = async (req, res, next) => {
  try {
    const formId = req.body.formId || req.params.formId;
    if (!formId) return res.status(400).json({ message: 'formId requis.' });
    
    // Obtenir le formulaire et son propriétaire pour vérifier le plan
    const form = await prisma.form.findUnique({ 
      where: { id: parseInt(formId) },
      include: { user: true }
    });
    
    if (!form) {
      return res.status(404).json({ message: 'Formulaire non trouvé.' });
    }
    
    const plan = form.user?.plan || 'free';
    const count = await prisma.submission.count({ where: { form_id: parseInt(formId) } });
    
    if (count >= QUOTAS[plan].submissionsPerForm) {
      return res.status(403).json({ message: 'Limite d\'inscriptions atteinte pour ce formulaire.' });
    }
    next();
  } catch (error) {
    console.error('Erreur quota:', error);
    return res.status(500).json({ message: 'Erreur lors de la vérification du quota.' });
  }
};

// Vérifie le quota d'exports CSV/PDF par jour
exports.checkExportQuota = async (req, res, next) => {
  try {
    const plan = await getUserPlan(req.user.id);
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    
    // Compter les exports du jour (on pourrait ajouter une table export_logs)
    // Pour l'instant, simulation basique
    const todayExports = 0; // await prisma.exportLog.count({ ... });
    
    if (todayExports >= QUOTAS[plan].exportsPerDay) {
      return res.status(403).json({ message: 'Limite d\'exports quotidienne atteinte.' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la vérification du quota.' });
  }
};
