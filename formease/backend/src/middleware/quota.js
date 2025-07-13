// Middleware de gestion des quotas et limitations pour FormEase
const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger");

const prisma = new PrismaClient();

// Configuration des quotas par plan
const QUOTA_CONFIG = {
  FREE: {
    maxForms: 1,
    maxSubmissions: 100,
    validityDays: 7, // 7 jours pour FREE
    maxEmailsPerMonth: 50,
    maxExportsPerDay: 5,
    features: ["basic_forms", "csv_export", "email_notifications"],
  },
  PREMIUM: {
    maxForms: 100,
    maxSubmissions: 10000,
    validityDays: 30, // 30 jours (1 mois) pour PREMIUM
    maxEmailsPerMonth: 5000,
    maxExportsPerDay: 100,
    features: [
      "all_forms",
      "payment_forms",
      "advanced_analytics",
      "ai_generator",
      "campaigns",
      "pdf_export",
      "webhooks",
    ],
  },
};

// Utilitaires
async function getUserPlan(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, plan_expiration: true },
  });

  // Vérifier si le plan premium a expiré
  if (user?.plan === "premium" && user.plan_expiration) {
    const now = new Date();
    if (now > user.plan_expiration) {
      // Rétrograder automatiquement vers FREE
      await prisma.user.update({
        where: { id: userId },
        data: { plan: "free", plan_expiration: null },
      });
      logger.info(
        `Plan premium expiré pour l'utilisateur ${userId}, rétrogradé vers FREE`
      );
      return "free";
    }
  }

  return user?.plan || "free";
}

async function logQuotaUsage(userId, type, details = {}) {
  try {
    await prisma.actionLog.create({
      data: {
        user_id: userId,
        action: `quota_${type}`,
        entity: "Quota",
        details: {
          quotaType: type,
          ...details,
        },
      },
    });
  } catch (error) {
    logger.error("Erreur lors du log quota:", error);
  }
}

// Middleware de vérification des quotas de formulaires
exports.checkFormQuota = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const plan = await getUserPlan(userId);
    const quota = QUOTA_CONFIG[plan.toUpperCase()];

    const formsCount = await prisma.form.count({
      where: { user_id: userId, archived: false },
    });

    if (formsCount >= quota.maxForms) {
      await logQuotaUsage(userId, "form_limit_exceeded", {
        currentCount: formsCount,
        limit: quota.maxForms,
        plan,
      });

      return res.status(403).json({
        message: `Limite de formulaires atteinte pour votre plan ${plan.toUpperCase()}.`,
        error: "FORM_QUOTA_EXCEEDED",
        quota: {
          used: formsCount,
          limit: quota.maxForms,
          plan,
        },
      });
    }

    // Ajouter les infos de quota à la requête
    req.quota = { plan, limits: quota, usage: { forms: formsCount } };
    next();
  } catch (error) {
    logger.error("Erreur lors de la vérification du quota formulaires:", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la vérification du quota." });
  }
};

// Middleware de vérification des quotas de soumissions
exports.checkSubmissionQuota = async (req, res, next) => {
  try {
    const formId = req.body.formId || req.params.formId;
    if (!formId) return res.status(400).json({ message: "formId requis." });

    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: { user: true },
    });

    if (!form) {
      return res.status(404).json({ message: "Formulaire non trouvé." });
    }

    const plan = await getUserPlan(form.user_id);
    const quota = QUOTA_CONFIG[plan.toUpperCase()];

    // Vérifier l'expiration du formulaire
    const formAge = Math.floor(
      (new Date() - new Date(form.created_at)) / (1000 * 60 * 60 * 24)
    );
    if (formAge > quota.validityDays) {
      await logQuotaUsage(form.user_id, "form_expired", {
        formId: form.id,
        formAge,
        validityDays: quota.validityDays,
        plan,
      });

      return res.status(403).json({
        message: `Formulaire expiré. Validité : ${
          quota.validityDays
        } jours pour le plan ${plan.toUpperCase()}.`,
        error: "FORM_EXPIRED",
        formAge,
        validityDays: quota.validityDays,
      });
    }

    // Vérifier le quota de soumissions
    const submissionsCount = await prisma.submission.count({
      where: { form_id: formId, archived: false },
    });

    if (submissionsCount >= quota.maxSubmissions) {
      await logQuotaUsage(form.user_id, "submission_limit_exceeded", {
        formId: form.id,
        currentCount: submissionsCount,
        limit: quota.maxSubmissions,
        plan,
      });

      return res.status(403).json({
        message: `Limite de soumissions atteinte pour ce formulaire (${quota.maxSubmissions} max).`,
        error: "SUBMISSION_QUOTA_EXCEEDED",
        quota: {
          used: submissionsCount,
          limit: quota.maxSubmissions,
          plan,
        },
      });
    }

    req.quota = {
      plan,
      limits: quota,
      usage: { submissions: submissionsCount },
    };
    next();
  } catch (error) {
    logger.error("Erreur quota soumissions:", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la vérification du quota." });
  }
};

// Middleware de vérification des quotas d'exports
exports.checkExportQuota = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const plan = await getUserPlan(userId);
    const quota = QUOTA_CONFIG[plan.toUpperCase()];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayExports = await prisma.exportLog.count({
      where: {
        user_id: userId,
        created_at: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (todayExports >= quota.maxExportsPerDay) {
      await logQuotaUsage(userId, "export_limit_exceeded", {
        currentCount: todayExports,
        limit: quota.maxExportsPerDay,
        plan,
      });

      return res.status(403).json({
        message: `Limite d'exports quotidienne atteinte (${quota.maxExportsPerDay} max).`,
        error: "EXPORT_QUOTA_EXCEEDED",
        quota: {
          used: todayExports,
          limit: quota.maxExportsPerDay,
          plan,
          resetsAt: tomorrow.toISOString(),
        },
      });
    }

    req.quota = { plan, limits: quota, usage: { exports: todayExports } };
    next();
  } catch (error) {
    logger.error("Erreur quota exports:", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la vérification du quota." });
  }
};

// Middleware de vérification des quotas d'emails
exports.checkEmailQuota = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const plan = await getUserPlan(userId);
    const quota = QUOTA_CONFIG[plan.toUpperCase()];

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyEmails = await prisma.emailLog.count({
      where: {
        user_id: userId,
        sent_at: {
          gte: startOfMonth,
        },
      },
    });

    if (monthlyEmails >= quota.maxEmailsPerMonth) {
      await logQuotaUsage(userId, "email_limit_exceeded", {
        currentCount: monthlyEmails,
        limit: quota.maxEmailsPerMonth,
        plan,
      });

      const nextMonth = new Date(startOfMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      return res.status(403).json({
        message: `Limite d'emails mensuelle atteinte (${quota.maxEmailsPerMonth} max).`,
        error: "EMAIL_QUOTA_EXCEEDED",
        quota: {
          used: monthlyEmails,
          limit: quota.maxEmailsPerMonth,
          plan,
          resetsAt: nextMonth.toISOString(),
        },
      });
    }

    req.quota = { plan, limits: quota, usage: { emails: monthlyEmails } };
    next();
  } catch (error) {
    logger.error("Erreur quota emails:", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la vérification du quota email." });
  }
};

// Middleware de vérification des fonctionnalités par plan
exports.checkFeatureAccess = (requiredFeature) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const plan = await getUserPlan(userId);
      const quota = QUOTA_CONFIG[plan.toUpperCase()];

      if (!quota.features.includes(requiredFeature)) {
        await logQuotaUsage(userId, "feature_access_denied", {
          requiredFeature,
          userPlan: plan,
          availableFeatures: quota.features,
        });

        return res.status(403).json({
          message: `Cette fonctionnalité nécessite un plan PREMIUM.`,
          error: "FEATURE_ACCESS_DENIED",
          requiredFeature,
          userPlan: plan,
          upgradeRequired: true,
        });
      }

      req.quota = { plan, limits: quota, hasFeature: requiredFeature };
      next();
    } catch (error) {
      logger.error("Erreur vérification fonctionnalité:", error);
      return res
        .status(500)
        .json({ message: "Erreur lors de la vérification d'accès." });
    }
  };
};

// Middleware de vérification de la validité des formulaires (route publique)
exports.checkFormValidity = async (req, res, next) => {
  try {
    const formId = req.body.formId || req.params.formId;
    if (!formId) return res.status(400).json({ message: "formId requis." });

    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: { user: true },
    });

    if (!form) {
      return res.status(404).json({ message: "Formulaire non trouvé." });
    }

    if (!form.is_active) {
      return res.status(403).json({
        message: "Ce formulaire n'est plus actif.",
        error: "FORM_INACTIVE",
      });
    }

    const plan = await getUserPlan(form.user_id);
    const quota = QUOTA_CONFIG[plan.toUpperCase()];
    const formAge = Math.floor(
      (new Date() - new Date(form.created_at)) / (1000 * 60 * 60 * 24)
    );

    if (formAge > quota.validityDays) {
      // Désactiver automatiquement le formulaire expiré
      await prisma.form.update({
        where: { id: formId },
        data: { is_active: false },
      });

      await logQuotaUsage(form.user_id, "form_auto_disabled", {
        formId: form.id,
        formAge,
        validityDays: quota.validityDays,
        plan,
      });

      return res.status(403).json({
        message: `Formulaire expiré et désactivé. Validité : ${
          quota.validityDays
        } jours pour le plan ${plan.toUpperCase()}.`,
        error: "FORM_EXPIRED",
        formAge,
        validityDays: quota.validityDays,
      });
    }

    next();
  } catch (error) {
    logger.error("Erreur validité formulaire:", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la vérification de la validité." });
  }
};

// Contrôleur pour obtenir le statut des quotas
exports.getQuotaStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const plan = await getUserPlan(userId);
    const quotas = QUOTA_CONFIG[plan.toUpperCase()];

    // Calculer l'usage actuel
    const [formsCount, todayExports, monthlyEmails, totalSubmissions] =
      await Promise.all([
        prisma.form.count({ where: { user_id: userId, archived: false } }),
        prisma.exportLog.count({
          where: {
            user_id: userId,
            created_at: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.emailLog.count({
          where: {
            user_id: userId,
            sent_at: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        prisma.submission.count({
          where: {
            form: { user_id: userId },
            archived: false,
          },
        }),
      ]);

    // Calculer l'usage de stockage (approximatif)
    const storageUsedMB = Math.round(totalSubmissions * 0.1); // ~100KB par soumission

    const usage = {
      forms: formsCount,
      exportsToday: todayExports,
      emailsThisMonth: monthlyEmails,
      totalSubmissions,
      storageUsedMB,
    };

    const percentages = {
      forms: Math.round((usage.forms / quotas.maxForms) * 100),
      exports: Math.round((usage.exportsToday / quotas.maxExportsPerDay) * 100),
      emails: Math.round(
        (usage.emailsThisMonth / quotas.maxEmailsPerMonth) * 100
      ),
      storage: Math.round(
        (usage.storageUsedMB / (quotas.storageGB * 1024)) * 100
      ),
    };

    // Calculer les dates de reset
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);

    res.json({
      plan,
      quotas,
      usage,
      percentages,
      resetDates: {
        dailyExports: tomorrow.toISOString(),
        monthlyEmails: nextMonth.toISOString(),
      },
      warnings: {
        formsNearLimit: percentages.forms >= 80,
        exportsNearLimit: percentages.exports >= 80,
        emailsNearLimit: percentages.emails >= 80,
        storageNearLimit: percentages.storage >= 80,
      },
    });
  } catch (error) {
    logger.error("Erreur status quota:", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la récupération du status." });
  }
};

// Tâche de maintenance pour désactiver les formulaires expirés
exports.disableExpiredForms = async () => {
  try {
    const forms = await prisma.form.findMany({
      where: { is_active: true, archived: false },
      include: { user: true },
    });

    let disabledCount = 0;

    for (const form of forms) {
      const plan = await getUserPlan(form.user_id);
      const quota = QUOTA_CONFIG[plan.toUpperCase()];
      const formAge = Math.floor(
        (new Date() - new Date(form.created_at)) / (1000 * 60 * 60 * 24)
      );

      if (formAge > quota.validityDays) {
        await prisma.form.update({
          where: { id: form.id },
          data: { is_active: false },
        });

        await logQuotaUsage(form.user_id, "form_auto_disabled_maintenance", {
          formId: form.id,
          formAge,
          validityDays: quota.validityDays,
          plan,
        });

        disabledCount++;
      }
    }

    logger.info(
      `Maintenance des formulaires expirés: ${disabledCount} formulaires désactivés`
    );
    return disabledCount;
  } catch (error) {
    logger.error("Erreur maintenance formulaires expirés:", error);
    return 0;
  }
};

// Utilitaire pour enregistrer l'usage d'une fonctionnalité
exports.logFeatureUsage = async (userId, feature, details = {}) => {
  try {
    await logQuotaUsage(userId, "feature_used", {
      feature,
      ...details,
    });
  } catch (error) {
    logger.error("Erreur log feature usage:", error);
  }
};

// Export des constantes
exports.QUOTAS = QUOTA_CONFIG;
exports.getUserPlan = getUserPlan;
