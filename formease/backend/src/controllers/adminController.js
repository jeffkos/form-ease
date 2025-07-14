// Contrôleur administrateur pour FormEase
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");

const prisma = new PrismaClient();

// Vérifier si l'utilisateur est SUPERADMIN
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== "SUPERADMIN") {
    return res.status(403).json({
      message: "Accès refusé : rôle SUPERADMIN requis",
      error: "INSUFFICIENT_PERMISSIONS",
    });
  }
  next();
}

// Dashboard principal avec statistiques globales
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Statistiques utilisateurs
    const [totalUsers, freeUsers, premiumUsers, newUsersThisMonth] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { plan: "free" } }),
        prisma.user.count({ where: { plan: "premium" } }),
        prisma.user.count({ where: { created_at: { gte: lastMonth } } }),
      ]);

    // Statistiques formulaires
    const [totalForms, activeForms, totalSubmissions, submissionsLast7Days] =
      await Promise.all([
        prisma.form.count(),
        prisma.form.count({ where: { is_active: true } }),
        prisma.submission.count(),
        prisma.submission.count({ where: { created_at: { gte: last7Days } } }),
      ]);

    // Statistiques financières
    const [totalRevenue, monthlyRevenue, activeSubscriptions] =
      await Promise.all([
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: "paid" },
        }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: "paid",
            created_at: { gte: lastMonth },
          },
        }),
        prisma.user.count({
          where: {
            plan: "premium",
            plan_expiration: { gte: now },
          },
        }),
      ]);

    // Métriques de performance
    const conversionRate =
      totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(2) : 0;
    const churnRate = 5; // À calculer avec des données historiques
    const averageRevenuePerUser =
      premiumUsers > 0 ? (totalRevenue._sum.amount || 0) / premiumUsers : 0;

    // Activité récente
    const recentActivity = await prisma.user.findMany({
      take: 10,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        plan: true,
        created_at: true,
      },
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          free: freeUsers,
          premium: premiumUsers,
          newThisMonth: newUsersThisMonth,
          conversionRate: parseFloat(conversionRate),
        },
        forms: {
          total: totalForms,
          active: activeForms,
          submissions: totalSubmissions,
          submissionsLast7Days,
        },
        revenue: {
          total: totalRevenue._sum.amount || 0,
          monthly: monthlyRevenue._sum.amount || 0,
          activeSubscriptions,
          averageRevenuePerUser: Math.round(averageRevenuePerUser),
        },
        performance: {
          conversionRate: parseFloat(conversionRate),
          churnRate,
          averageRevenuePerUser: Math.round(averageRevenuePerUser),
        },
        recentActivity,
      },
    });
  } catch (error) {
    logger.error("Error fetching admin dashboard stats:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des statistiques",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

// Gestion des utilisateurs - Liste avec pagination et filtres
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const plan = req.query.plan || "";
    const role = req.query.role || "";

    const skip = (page - 1) * limit;

    // Construction des filtres
    const where = {};
    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (plan) where.plan = plan;
    if (role) where.role = role;

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          role: true,
          plan: true,
          plan_expiration: true,
          created_at: true,
          _count: {
            select: {
              forms: true,
              submissions: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching users:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des utilisateurs",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

// Mise à jour d'un utilisateur (rôle, plan, suspension)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, plan, plan_expiration, is_suspended } = req.body;

    const updateData = {};
    if (role) updateData.role = role;
    if (plan) updateData.plan = plan;
    if (plan_expiration) updateData.plan_expiration = new Date(plan_expiration);
    if (typeof is_suspended === "boolean")
      updateData.is_suspended = is_suspended;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        plan: true,
        plan_expiration: true,
        is_suspended: true,
      },
    });

    logger.info(`User ${id} updated by admin ${req.user.id}`, {
      updatedFields: Object.keys(updateData),
      adminId: req.user.id,
    });

    res.json({
      success: true,
      message: "Utilisateur mis à jour avec succès",
      data: user,
    });
  } catch (error) {
    logger.error("Error updating user:", error);
    res.status(500).json({
      message: "Erreur lors de la mise à jour de l'utilisateur",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

// Suspension/Réactivation d'un utilisateur
const toggleUserSuspension = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: { is_suspended: true, email: true },
    });

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur non trouvé",
        error: "USER_NOT_FOUND",
      });
    }

    const newSuspensionStatus = !user.is_suspended;

    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { is_suspended: newSuspensionStatus },
    });

    // Log de l'action
    logger.info(
      `User ${id} ${
        newSuspensionStatus ? "suspended" : "reactivated"
      } by admin ${req.user.id}`,
      {
        reason,
        adminId: req.user.id,
        userEmail: user.email,
      }
    );

    res.json({
      success: true,
      message: `Utilisateur ${
        newSuspensionStatus ? "suspendu" : "réactivé"
      } avec succès`,
      data: { is_suspended: newSuspensionStatus },
    });
  } catch (error) {
    logger.error("Error toggling user suspension:", error);
    res.status(500).json({
      message: "Erreur lors de la modification du statut de suspension",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

// Rapports financiers détaillés
const getFinancialReports = async (req, res) => {
  try {
    const { startDate, endDate, period = "month" } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Revenus par période
    const payments = await prisma.payment.findMany({
      where: {
        status: "paid",
        created_at: {
          gte: start,
          lte: end,
        },
      },
      select: {
        amount: true,
        created_at: true,
        user: {
          select: {
            email: true,
            plan: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Groupement par période
    const revenueByPeriod = {};
    payments.forEach((payment) => {
      const key =
        period === "month"
          ? payment.created_at.toISOString().substring(0, 7)
          : payment.created_at.toISOString().substring(0, 10);

      if (!revenueByPeriod[key]) {
        revenueByPeriod[key] = { amount: 0, count: 0 };
      }
      revenueByPeriod[key].amount += payment.amount;
      revenueByPeriod[key].count += 1;
    });

    // Métriques financières
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const averageOrderValue =
      payments.length > 0 ? totalRevenue / payments.length : 0;

    // Prévisions (simple extrapolation)
    const currentMonthRevenue =
      revenueByPeriod[new Date().toISOString().substring(0, 7)]?.amount || 0;
    const projectedMonthlyRevenue = currentMonthRevenue * 1.1; // +10% de croissance

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalTransactions: payments.length,
          averageOrderValue: Math.round(averageOrderValue),
          projectedMonthlyRevenue: Math.round(projectedMonthlyRevenue),
        },
        revenueByPeriod,
        recentTransactions: payments.slice(0, 20),
      },
    });
  } catch (error) {
    logger.error("Error fetching financial reports:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des rapports financiers",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

// Métriques business avancées
const getBusinessMetrics = async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );
    const last3Months = new Date(
      now.getFullYear(),
      now.getMonth() - 3,
      now.getDate()
    );

    // Métriques d'acquisition
    const [newUsersThisMonth, newUsersLastMonth] = await Promise.all([
      prisma.user.count({ where: { created_at: { gte: lastMonth } } }),
      prisma.user.count({
        where: {
          created_at: {
            gte: new Date(
              lastMonth.getFullYear(),
              lastMonth.getMonth() - 1,
              lastMonth.getDate()
            ),
            lt: lastMonth,
          },
        },
      }),
    ]);

    // Métriques de conversion
    const [totalUsers, premiumUsers, newPremiumThisMonth] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { plan: "premium" } }),
      prisma.user.count({
        where: {
          plan: "premium",
          created_at: { gte: lastMonth },
        },
      }),
    ]);

    // Métriques d'engagement
    const [activeForms, totalSubmissions, submissionsThisMonth] =
      await Promise.all([
        prisma.form.count({ where: { is_active: true } }),
        prisma.submission.count(),
        prisma.submission.count({ where: { created_at: { gte: lastMonth } } }),
      ]);

    // Calculs des métriques
    const conversionRate =
      totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;
    const growthRate =
      newUsersLastMonth > 0
        ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
        : 0;
    const premiumConversionRate =
      newUsersThisMonth > 0
        ? (newPremiumThisMonth / newUsersThisMonth) * 100
        : 0;

    // Customer Lifetime Value (estimation simple)
    const averageMonthlyRevenue = premiumUsers * 12; // 12€/mois
    const estimatedCLV = averageMonthlyRevenue * 12; // 12 mois de rétention moyenne

    res.json({
      success: true,
      data: {
        acquisition: {
          newUsersThisMonth,
          newUsersLastMonth,
          growthRate: Math.round(growthRate * 100) / 100,
        },
        conversion: {
          totalUsers,
          premiumUsers,
          conversionRate: Math.round(conversionRate * 100) / 100,
          premiumConversionRate: Math.round(premiumConversionRate * 100) / 100,
        },
        engagement: {
          activeForms,
          totalSubmissions,
          submissionsThisMonth,
          averageSubmissionsPerForm:
            activeForms > 0 ? Math.round(totalSubmissions / activeForms) : 0,
        },
        revenue: {
          monthlyRecurringRevenue: averageMonthlyRevenue,
          estimatedCLV: Math.round(estimatedCLV),
          averageRevenuePerUser:
            premiumUsers > 0
              ? Math.round(averageMonthlyRevenue / premiumUsers)
              : 0,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching business metrics:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des métriques business",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

// Outils de modération - Formulaires signalés ou suspects
const getModerationQueue = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Formulaires avec beaucoup de soumissions (potentiellement suspects)
    const suspiciousForms = await prisma.form.findMany({
      where: {
        is_active: true,
        _count: {
          submissions: { gt: 1000 }, // Plus de 1000 soumissions
        },
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            plan: true,
          },
        },
        _count: {
          select: { submissions: true },
        },
      },
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
    });

    // Utilisateurs avec beaucoup de formulaires actifs
    const suspiciousUsers = await prisma.user.findMany({
      where: {
        forms: {
          some: { is_active: true },
        },
      },
      include: {
        _count: {
          select: {
            forms: true,
            submissions: true,
          },
        },
      },
      having: {
        forms: { _count: { gt: 50 } }, // Plus de 50 formulaires
      },
      take: 10,
      orderBy: { created_at: "desc" },
    });

    res.json({
      success: true,
      data: {
        suspiciousForms,
        suspiciousUsers,
        pagination: {
          page,
          limit,
          total: suspiciousForms.length,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching moderation queue:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération de la file de modération",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

// Logs d'audit système
const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const action = req.query.action || "";
    const userId = req.query.userId || "";

    const skip = (page - 1) * limit;

    const where = {};
    if (action) where.action = action;
    if (userId) where.user_id = parseInt(userId);

    const [logs, totalCount] = await Promise.all([
      prisma.actionLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      }),
      prisma.actionLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching audit logs:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des logs d'audit",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

module.exports = {
  requireSuperAdmin,
  getDashboardStats,
  getUsers,
  updateUser,
  toggleUserSuspension,
  getFinancialReports,
  getBusinessMetrics,
  getModerationQueue,
  getAuditLogs,
};
