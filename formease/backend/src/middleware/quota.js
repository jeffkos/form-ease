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
    exportsPerDay: 5,
    emailsPerMonth: 50,
    formValidityDays: 18,
    storageGB: 0.1,
    supportLevel: 'community'
  },
  premium: {
    forms: 100,
    submissionsPerForm: 10000,
    exportsPerDay: 100,
    emailsPerMonth: 5000,
    formValidityDays: 365,
    storageGB: 10,
    supportLevel: 'priority'
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

// Vérifie le quota d'emails par mois
exports.checkEmailQuota = async (req, res, next) => {
  try {
    const plan = await getUserPlan(req.user.id);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    // Compter les emails envoyés ce mois (on devrait ajouter une table email_logs)
    // Pour l'instant, simulation basique - à implémenter avec une vraie table
    const monthlyEmails = 0; // await prisma.emailLog.count({ ... });
    
    if (monthlyEmails >= QUOTAS[plan].emailsPerMonth) {
      return res.status(403).json({ 
        message: 'Limite d\'emails mensuelle atteinte pour votre offre.',
        quota: QUOTAS[plan].emailsPerMonth,
        used: monthlyEmails
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la vérification du quota email.' });
  }
};

// Vérifie la validité temporelle du formulaire selon le plan
exports.checkFormValidity = async (req, res, next) => {
  try {
    const formId = req.body.formId || req.params.formId;
    if (!formId) return res.status(400).json({ message: 'formId requis.' });
    
    const form = await prisma.form.findUnique({ 
      where: { id: parseInt(formId) },
      include: { user: true }
    });
    
    if (!form) {
      return res.status(404).json({ message: 'Formulaire non trouvé.' });
    }
    
    const plan = form.user?.plan || 'free';
    const validityDays = QUOTAS[plan].formValidityDays;
    const formAge = Math.floor((new Date() - new Date(form.created_at)) / (1000 * 60 * 60 * 24));
    
    if (formAge > validityDays) {
      return res.status(403).json({ 
        message: `Formulaire expiré. Validité : ${validityDays} jours pour le plan ${plan}.`,
        formAge: formAge,
        validityDays: validityDays
      });
    }
    next();
  } catch (error) {
    console.error('Erreur validité formulaire:', error);
    return res.status(500).json({ message: 'Erreur lors de la vérification de la validité.' });
  }
};

// Obtenir les quotas et usage actuel pour un utilisateur
exports.getQuotaStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const plan = await getUserPlan(userId);
    const quotas = QUOTAS[plan];
    
    // Calculer l'usage actuel
    const formsCount = await prisma.form.count({ where: { user_id: userId } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    // Usage actuel (à affiner avec de vraies tables de logs)
    const usage = {
      forms: formsCount,
      exportsToday: 0, // À implémenter avec export_logs
      emailsThisMonth: 0, // À implémenter avec email_logs
      storageUsedMB: 0 // À calculer
    };
    
    res.json({
      plan,
      quotas,
      usage,
      percentage: {
        forms: Math.round((usage.forms / quotas.forms) * 100),
        exports: Math.round((usage.exportsToday / quotas.exportsPerDay) * 100),
        emails: Math.round((usage.emailsThisMonth / quotas.emailsPerMonth) * 100)
      }
    });
  } catch (error) {
    console.error('Erreur status quota:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération du status.' });
  }
};
