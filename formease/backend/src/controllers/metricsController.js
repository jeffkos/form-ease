// Contrôleur des métriques différenciées par plan pour FormEase
const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger");
const { getUserPlan, QUOTAS } = require("../middleware/quota");

const prisma = new PrismaClient();

// Configuration des métriques par plan
const METRICS_CONFIG = {
  FREE: {
    analyticsRetentionDays: 7, // 7 jours pour FREE
    maxExportsPerDay: 5,
    features: ["basic_analytics", "csv_export"],
  },
  PREMIUM: {
    analyticsRetentionDays: 30, // 30 jours (1 mois) pour PREMIUM
    maxExportsPerDay: 100,
    features: [
      "advanced_analytics",
      "pdf_export",
      "custom_reports",
      "geographic_data",
    ],
  },
};

// Métriques du dashboard utilisateur (différenciées par plan)
exports.getDashboardMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const plan = await getUserPlan(userId);
    const metricsConfig = METRICS_CONFIG[plan.toUpperCase()];

    // Calculer la période d'analytics selon le plan
    const analyticsStartDate = new Date();
    analyticsStartDate.setDate(
      analyticsStartDate.getDate() - metricsConfig.analyticsRetentionDays
    );

    // Métriques de base
    const [
      totalForms,
      activeForms,
      totalSubmissions,
      recentSubmissions,
      totalContacts,
      emailsSent,
      exports,
    ] = await Promise.all([
      prisma.form.count({
        where: { user_id: userId, archived: false },
      }),
      prisma.form.count({
        where: { user_id: userId, is_active: true, archived: false },
      }),
      prisma.submission.count({
        where: {
          form: { user_id: userId },
          archived: false,
        },
      }),
      prisma.submission.count({
        where: {
          form: { user_id: userId },
          created_at: { gte: analyticsStartDate },
          archived: false,
        },
      }),
      prisma.contact.count({
        where: { source_form_id: { in: await getFormIds(userId) } },
      }),
      prisma.emailLog.count({
        where: {
          user_id: userId,
          sent_at: { gte: analyticsStartDate },
        },
      }),
      prisma.exportLog.count({
        where: {
          user_id: userId,
          created_at: { gte: analyticsStartDate },
        },
      }),
    ]);

    // Métriques temporelles (graphiques)
    const timeSeriesData = await getTimeSeriesData(
      userId,
      plan,
      analyticsStartDate
    );

    // Métriques par formulaire (top 5)
    const topForms = await getTopForms(userId, plan, analyticsStartDate);

    // Métriques géographiques (si plan premium)
    const geographicData =
      plan === "premium" ? await getGeographicData(userId) : null;

    // Taux de conversion
    const conversionRate =
      totalForms > 0 ? Math.round((totalSubmissions / totalForms) * 100) : 0;

    // Métriques de performance
    const performanceMetrics = await getPerformanceMetrics(
      userId,
      plan,
      analyticsStartDate
    );

    res.json({
      plan,
      analyticsRange: {
        days: quotas.formValidityDays,
        startDate: analyticsStartDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      overview: {
        totalForms,
        activeForms,
        totalSubmissions,
        recentSubmissions,
        totalContacts,
        emailsSent,
        exports,
        conversionRate,
      },
      timeSeries: timeSeriesData,
      topForms,
      geographic: geographicData,
      performance: performanceMetrics,
      quotas: await getQuotaUsage(userId, plan),
    });
  } catch (error) {
    logger.error("Erreur métriques dashboard:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des métriques" });
  }
};

// Métriques de performance (temps de réponse, taux d'engagement)
async function getPerformanceMetrics(userId, plan, startDate) {
  try {
    const [avgResponseTime, emailOpenRate, formCompletionRate, bounceRate] =
      await Promise.all([
        // Temps de réponse moyen (simulé)
        Promise.resolve(1.2), // 1.2 secondes

        // Taux d'ouverture des emails
        getEmailOpenRate(userId, startDate),

        // Taux de completion des formulaires
        getFormCompletionRate(userId, startDate),

        // Taux de rebond (simulé)
        Promise.resolve(15.3), // 15.3%
      ]);

    return {
      avgResponseTime,
      emailOpenRate,
      formCompletionRate,
      bounceRate,
      availableInPlan: plan === "premium",
    };
  } catch (error) {
    logger.error("Erreur métriques performance:", error);
    return null;
  }
}

// Taux d'ouverture des emails
async function getEmailOpenRate(userId, startDate) {
  const [totalEmails, openedEmails] = await Promise.all([
    prisma.emailLog.count({
      where: {
        user_id: userId,
        sent_at: { gte: startDate },
      },
    }),
    prisma.emailLog.count({
      where: {
        user_id: userId,
        sent_at: { gte: startDate },
        status: "opened",
      },
    }),
  ]);

  return totalEmails > 0 ? Math.round((openedEmails / totalEmails) * 100) : 0;
}

// Taux de completion des formulaires
async function getFormCompletionRate(userId, startDate) {
  const submissions = await prisma.submission.findMany({
    where: {
      form: { user_id: userId },
      created_at: { gte: startDate },
    },
    select: { data: true },
  });

  if (submissions.length === 0) return 0;

  // Calculer le taux de completion basé sur le nombre de champs remplis
  const completionRates = submissions.map((sub) => {
    const data = sub.data || {};
    const filledFields = Object.values(data).filter(
      (val) => val && val.toString().trim() !== ""
    ).length;
    const totalFields = Object.keys(data).length;
    return totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
  });

  return Math.round(
    completionRates.reduce((a, b) => a + b, 0) / completionRates.length
  );
}

// Données temporelles pour les graphiques
async function getTimeSeriesData(userId, plan, startDate) {
  const days = Math.min(
    plan === "premium" ? 30 : 7,
    Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24))
  );

  const timeSeriesData = [];

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const [submissions, emails, views] = await Promise.all([
      prisma.submission.count({
        where: {
          form: { user_id: userId },
          created_at: { gte: date, lt: nextDate },
        },
      }),
      prisma.emailLog.count({
        where: {
          user_id: userId,
          sent_at: { gte: date, lt: nextDate },
        },
      }),
      // Vues de formulaire (simulé)
      Promise.resolve(Math.floor(Math.random() * 50) + 10),
    ]);

    timeSeriesData.push({
      date: date.toISOString().split("T")[0],
      submissions,
      emails,
      views,
    });
  }

  return timeSeriesData;
}

// Top 5 des formulaires les plus performants
async function getTopForms(userId, plan, startDate) {
  const forms = await prisma.form.findMany({
    where: {
      user_id: userId,
      archived: false,
      created_at: { gte: startDate },
    },
    include: {
      _count: {
        select: {
          submissions: {
            where: { archived: false },
          },
        },
      },
    },
    orderBy: {
      submissions: {
        _count: "desc",
      },
    },
    take: 5,
  });

  return forms.map((form) => ({
    id: form.id,
    title: form.title,
    submissions: form._count.submissions,
    created_at: form.created_at,
    is_active: form.is_active,
    conversionRate: Math.round(Math.random() * 20) + 5, // Simulé
  }));
}

// Données géographiques (premium uniquement)
async function getGeographicData(userId) {
  const contacts = await prisma.contact.findMany({
    where: {
      source_form_id: { in: await getFormIds(userId) },
    },
    select: {
      city: true,
      country: true,
    },
  });

  // Grouper par pays
  const countryData = {};
  contacts.forEach((contact) => {
    if (contact.country) {
      countryData[contact.country] = (countryData[contact.country] || 0) + 1;
    }
  });

  // Grouper par ville
  const cityData = {};
  contacts.forEach((contact) => {
    if (contact.city) {
      cityData[contact.city] = (cityData[contact.city] || 0) + 1;
    }
  });

  return {
    countries: Object.entries(countryData)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    cities: Object.entries(cityData)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  };
}

// Obtenir les IDs des formulaires d'un utilisateur
async function getFormIds(userId) {
  const forms = await prisma.form.findMany({
    where: { user_id: userId },
    select: { id: true },
  });
  return forms.map((f) => f.id);
}

// Usage des quotas
async function getQuotaUsage(userId, plan) {
  const quotas = QUOTAS[plan];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [formsUsed, exportsToday, emailsThisMonth] = await Promise.all([
    prisma.form.count({ where: { user_id: userId, archived: false } }),
    prisma.exportLog.count({
      where: {
        user_id: userId,
        created_at: { gte: today },
      },
    }),
    prisma.emailLog.count({
      where: {
        user_id: userId,
        sent_at: {
          gte: new Date(today.getFullYear(), today.getMonth(), 1),
        },
      },
    }),
  ]);

  return {
    forms: {
      used: formsUsed,
      limit: quotas.forms,
      percentage: Math.round((formsUsed / quotas.forms) * 100),
    },
    exports: {
      used: exportsToday,
      limit: quotas.exportsPerDay,
      percentage: Math.round((exportsToday / quotas.exportsPerDay) * 100),
    },
    emails: {
      used: emailsThisMonth,
      limit: quotas.emailsPerMonth,
      percentage: Math.round((emailsThisMonth / quotas.emailsPerMonth) * 100),
    },
  };
}

// Métriques d'engagement par formulaire
exports.getFormEngagementMetrics = async (req, res) => {
  try {
    const { formId } = req.params;
    const userId = req.user.id;
    const plan = await getUserPlan(userId);

    // Vérifier que le formulaire appartient à l'utilisateur
    const form = await prisma.form.findFirst({
      where: { id: formId, user_id: userId },
    });

    if (!form) {
      return res.status(404).json({ message: "Formulaire non trouvé" });
    }

    const analyticsStartDate = new Date();
    analyticsStartDate.setDate(
      analyticsStartDate.getDate() - (plan === "premium" ? 30 : 7)
    );

    const [
      totalSubmissions,
      recentSubmissions,
      avgCompletionTime,
      dropOffPoints,
      deviceBreakdown,
    ] = await Promise.all([
      prisma.submission.count({
        where: { form_id: formId, archived: false },
      }),
      prisma.submission.count({
        where: {
          form_id: formId,
          created_at: { gte: analyticsStartDate },
          archived: false,
        },
      }),
      getAvgCompletionTime(formId, analyticsStartDate),
      getDropOffPoints(formId, analyticsStartDate),
      getDeviceBreakdown(formId, analyticsStartDate),
    ]);

    res.json({
      formId,
      plan,
      analyticsRange: {
        days: plan === "premium" ? 30 : 7,
        startDate: analyticsStartDate.toISOString(),
      },
      metrics: {
        totalSubmissions,
        recentSubmissions,
        avgCompletionTime,
        dropOffPoints: plan === "premium" ? dropOffPoints : null,
        deviceBreakdown: plan === "premium" ? deviceBreakdown : null,
      },
    });
  } catch (error) {
    logger.error("Erreur métriques engagement:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des métriques" });
  }
};

// Temps de completion moyen
async function getAvgCompletionTime(formId, startDate) {
  // Simulé - en réalité, il faudrait tracker le temps de début et fin
  return Math.round(Math.random() * 300) + 60; // 60-360 secondes
}

// Points d'abandon dans le formulaire
async function getDropOffPoints(formId, startDate) {
  // Simulé - analyser les soumissions partielles
  return [
    { field: "email", dropOffRate: 5 },
    { field: "phone", dropOffRate: 15 },
    { field: "message", dropOffRate: 25 },
  ];
}

// Répartition par device
async function getDeviceBreakdown(formId, startDate) {
  // Simulé - analyser les user agents
  return {
    desktop: 60,
    mobile: 35,
    tablet: 5,
  };
}

// Métriques de comparaison (premium uniquement)
exports.getComparisonMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const plan = await getUserPlan(userId);

    if (plan !== "premium") {
      return res.status(403).json({
        message: "Cette fonctionnalité nécessite un plan PREMIUM",
        error: "PREMIUM_REQUIRED",
      });
    }

    const { period = "30d" } = req.query;
    const days = period === "7d" ? 7 : 30;

    const currentPeriod = new Date();
    currentPeriod.setDate(currentPeriod.getDate() - days);

    const previousPeriod = new Date();
    previousPeriod.setDate(previousPeriod.getDate() - days * 2);

    const [currentMetrics, previousMetrics] = await Promise.all([
      getMetricsForPeriod(userId, currentPeriod, new Date()),
      getMetricsForPeriod(userId, previousPeriod, currentPeriod),
    ]);

    const comparison = {
      submissions: calculateGrowth(
        currentMetrics.submissions,
        previousMetrics.submissions
      ),
      emails: calculateGrowth(currentMetrics.emails, previousMetrics.emails),
      forms: calculateGrowth(currentMetrics.forms, previousMetrics.forms),
      conversion: calculateGrowth(
        currentMetrics.conversion,
        previousMetrics.conversion
      ),
    };

    res.json({
      period: `${days}d`,
      current: currentMetrics,
      previous: previousMetrics,
      comparison,
    });
  } catch (error) {
    logger.error("Erreur métriques comparaison:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des métriques" });
  }
};

// Métriques pour une période donnée
async function getMetricsForPeriod(userId, startDate, endDate) {
  const [submissions, emails, forms] = await Promise.all([
    prisma.submission.count({
      where: {
        form: { user_id: userId },
        created_at: { gte: startDate, lt: endDate },
      },
    }),
    prisma.emailLog.count({
      where: {
        user_id: userId,
        sent_at: { gte: startDate, lt: endDate },
      },
    }),
    prisma.form.count({
      where: {
        user_id: userId,
        created_at: { gte: startDate, lt: endDate },
      },
    }),
  ]);

  return {
    submissions,
    emails,
    forms,
    conversion: forms > 0 ? Math.round((submissions / forms) * 100) : 0,
  };
}

// Calculer la croissance
function calculateGrowth(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Export des données (avec limitations par plan)
exports.exportMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const plan = await getUserPlan(userId);
    const { format = "csv" } = req.query;

    // Vérifier l'accès à l'export
    if (format === "pdf" && plan !== "premium") {
      return res.status(403).json({
        message: "L'export PDF nécessite un plan PREMIUM",
        error: "PREMIUM_REQUIRED",
      });
    }

    const metrics = await getDashboardMetrics(req, res);

    // Enregistrer l'export
    await prisma.exportLog.create({
      data: {
        user_id: userId,
        type: `metrics_${format}`,
        filename: `metrics_${new Date().toISOString().split("T")[0]}.${format}`,
      },
    });

    res.json({
      message: "Export généré avec succès",
      format,
      data: metrics,
    });
  } catch (error) {
    logger.error("Erreur export métriques:", error);
    res.status(500).json({ message: "Erreur lors de l'export" });
  }
};
