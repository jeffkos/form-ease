#!/usr/bin/env node

// Script de maintenance des quotas et limitations FormEase
// À exécuter quotidiennement via cron job

const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger");
const {
  disableExpiredForms,
  getUserPlan,
  QUOTAS,
} = require("../middleware/quota");

const prisma = new PrismaClient();

// Configuration des quotas pour la maintenance
const QUOTA_CONFIG = {
  FREE: {
    validityDays: 7, // 7 jours pour FREE
    maxForms: 1,
    maxSubmissions: 100,
    maxEmailsPerMonth: 50,
  },
  PREMIUM: {
    validityDays: 30, // 30 jours (1 mois) pour PREMIUM
    maxForms: 100,
    maxSubmissions: 10000,
    maxEmailsPerMonth: 5000,
  },
};

// Configuration du script
const MAINTENANCE_CONFIG = {
  dryRun: process.env.DRY_RUN === "true",
  verbose: process.env.VERBOSE === "true",
  batchSize: 100,
};

// Fonction principale de maintenance
async function runMaintenance() {
  const startTime = Date.now();
  let stats = {
    formsDisabled: 0,
    usersDowngraded: 0,
    logsArchived: 0,
    errors: 0,
  };

  try {
    logger.info("🔧 Début de la maintenance des quotas", {
      quotaConfig: QUOTA_CONFIG,
      maintenanceConfig: MAINTENANCE_CONFIG,
    });

    // 1. Désactiver les formulaires expirés
    stats.formsDisabled = await disableExpiredForms();

    // 2. Vérifier les plans premium expirés
    stats.usersDowngraded = await downgradeExpiredPremiumUsers();

    // 3. Archiver les anciens logs
    stats.logsArchived = await archiveOldLogs();

    // 4. Nettoyer les tokens expirés
    await cleanupExpiredTokens();

    // 5. Générer rapport de quotas
    await generateQuotaReport();

    const duration = Date.now() - startTime;
    logger.info("✅ Maintenance terminée avec succès", {
      stats,
      duration: `${duration}ms`,
      dryRun: MAINTENANCE_CONFIG.dryRun,
    });

    if (!MAINTENANCE_CONFIG.dryRun) {
      // Enregistrer l'exécution de la maintenance
      await prisma.actionLog.create({
        data: {
          action: "maintenance_quotas",
          entity: "System",
          details: {
            stats,
            duration,
            timestamp: new Date().toISOString(),
          },
        },
      });
    }
  } catch (error) {
    logger.error("❌ Erreur lors de la maintenance:", error);
    stats.errors++;
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  return stats;
}

// Rétrograder les utilisateurs premium expirés
async function downgradeExpiredPremiumUsers() {
  try {
    const expiredUsers = await prisma.user.findMany({
      where: {
        plan: "premium",
        plan_expiration: {
          lt: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
        plan_expiration: true,
      },
    });

    if (expiredUsers.length === 0) {
      logger.info("Aucun utilisateur premium expiré trouvé");
      return 0;
    }

    logger.info(
      `Rétrogradation de ${expiredUsers.length} utilisateurs premium expirés`
    );

    if (!MAINTENANCE_CONFIG.dryRun) {
      for (const user of expiredUsers) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: "free",
            plan_expiration: null,
          },
        });

        // Log de l'action
        await prisma.actionLog.create({
          data: {
            user_id: user.id,
            action: "downgrade_expired_premium",
            entity: "User",
            entity_id: user.id,
            details: {
              previousPlan: "premium",
              newPlan: "free",
              expirationDate: user.plan_expiration?.toISOString(),
            },
          },
        });

        if (MAINTENANCE_CONFIG.verbose) {
          logger.info(`Utilisateur ${user.email} rétrogradé vers FREE`);
        }
      }
    }

    return expiredUsers.length;
  } catch (error) {
    logger.error("Erreur lors de la rétrogradation des utilisateurs:", error);
    return 0;
  }
}

// Archiver les anciens logs
async function archiveOldLogs() {
  try {
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - 90); // Archiver les logs > 90 jours

    const [actionLogsCount, exportLogsCount, emailLogsCount] =
      await Promise.all([
        prisma.actionLog.count({
          where: { date: { lt: archiveDate } },
        }),
        prisma.exportLog.count({
          where: { created_at: { lt: archiveDate } },
        }),
        prisma.emailLog.count({
          where: { sent_at: { lt: archiveDate } },
        }),
      ]);

    const totalLogs = actionLogsCount + exportLogsCount + emailLogsCount;

    if (totalLogs === 0) {
      logger.info("Aucun log ancien à archiver");
      return 0;
    }

    logger.info(`Archivage de ${totalLogs} logs anciens`);

    if (!MAINTENANCE_CONFIG.dryRun) {
      // En production, on pourrait déplacer vers une table d'archive
      // Pour l'instant, on supprime les logs très anciens
      await Promise.all([
        prisma.actionLog.deleteMany({
          where: { date: { lt: archiveDate } },
        }),
        prisma.exportLog.deleteMany({
          where: { created_at: { lt: archiveDate } },
        }),
        prisma.emailLog.deleteMany({
          where: { sent_at: { lt: archiveDate } },
        }),
      ]);
    }

    return totalLogs;
  } catch (error) {
    logger.error("Erreur lors de l'archivage des logs:", error);
    return 0;
  }
}

// Nettoyer les tokens expirés
async function cleanupExpiredTokens() {
  try {
    const expiredTokens = await prisma.refreshToken.count({
      where: {
        expires_at: { lt: new Date() },
      },
    });

    if (expiredTokens === 0) {
      logger.info("Aucun token expiré à nettoyer");
      return;
    }

    logger.info(`Nettoyage de ${expiredTokens} tokens expirés`);

    if (!MAINTENANCE_CONFIG.dryRun) {
      await prisma.refreshToken.deleteMany({
        where: {
          expires_at: { lt: new Date() },
        },
      });
    }
  } catch (error) {
    logger.error("Erreur lors du nettoyage des tokens:", error);
  }
}

// Générer un rapport de quotas
async function generateQuotaReport() {
  try {
    const [
      totalUsers,
      freeUsers,
      premiumUsers,
      totalForms,
      activeForms,
      totalSubmissions,
      todaySubmissions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { plan: "free" } }),
      prisma.user.count({ where: { plan: "premium" } }),
      prisma.form.count(),
      prisma.form.count({ where: { is_active: true } }),
      prisma.submission.count(),
      prisma.submission.count({
        where: {
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    // Calculer les utilisateurs proches des limites
    const usersNearLimits = await getUsersNearQuotaLimits();

    const report = {
      timestamp: new Date().toISOString(),
      users: {
        total: totalUsers,
        free: freeUsers,
        premium: premiumUsers,
        conversionRate:
          totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0,
      },
      forms: {
        total: totalForms,
        active: activeForms,
        activeRate:
          totalForms > 0 ? Math.round((activeForms / totalForms) * 100) : 0,
      },
      submissions: {
        total: totalSubmissions,
        today: todaySubmissions,
        avgPerForm:
          totalForms > 0 ? Math.round(totalSubmissions / totalForms) : 0,
      },
      quotaWarnings: usersNearLimits,
    };

    logger.info("📊 Rapport de quotas généré", { report });

    if (!MAINTENANCE_CONFIG.dryRun) {
      // Sauvegarder le rapport
      await prisma.actionLog.create({
        data: {
          action: "quota_report",
          entity: "System",
          details: report,
        },
      });
    }
  } catch (error) {
    logger.error("Erreur lors de la génération du rapport:", error);
  }
}

// Trouver les utilisateurs proches des limites de quotas
async function getUsersNearQuotaLimits() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        plan: true,
        _count: {
          select: {
            forms: true,
            exportLogs: {
              where: {
                created_at: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
              },
            },
            emailLogs: {
              where: {
                sent_at: {
                  gte: new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    1
                  ),
                },
              },
            },
          },
        },
      },
    });

    const usersNearLimits = users.filter((user) => {
      const quota = QUOTAS[user.plan];
      const formsUsage = (user._count.forms / quota.forms) * 100;
      const exportsUsage = (user._count.exportLogs / quota.exportsPerDay) * 100;
      const emailsUsage = (user._count.emailLogs / quota.emailsPerMonth) * 100;

      return formsUsage >= 80 || exportsUsage >= 80 || emailsUsage >= 80;
    });

    return usersNearLimits.map((user) => ({
      userId: user.id,
      email: user.email,
      plan: user.plan,
      usage: {
        forms: user._count.forms,
        exports: user._count.exportLogs,
        emails: user._count.emailLogs,
      },
    }));
  } catch (error) {
    logger.error(
      "Erreur lors de la recherche des utilisateurs proches des limites:",
      error
    );
    return [];
  }
}

// Fonction d'aide pour les arguments de ligne de commande
function parseArguments() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
📋 Script de maintenance des quotas FormEase

Usage: node maintenanceQuotas.js [options]

Options:
  --dry-run, -d     Mode simulation (aucune modification)
  --verbose, -v     Mode verbeux
  --help, -h        Afficher cette aide

Variables d'environnement:
  DRY_RUN=true      Mode simulation
  VERBOSE=true      Mode verbeux
  
Exemples:
  node maintenanceQuotas.js --dry-run
  DRY_RUN=true node maintenanceQuotas.js
  node maintenanceQuotas.js --verbose
    `);
    process.exit(0);
  }

  if (args.includes("--dry-run") || args.includes("-d")) {
    MAINTENANCE_CONFIG.dryRun = true;
  }

  if (args.includes("--verbose") || args.includes("-v")) {
    MAINTENANCE_CONFIG.verbose = true;
  }
}

// Point d'entrée principal
if (require.main === module) {
  parseArguments();

  runMaintenance()
    .then((stats) => {
      console.log("✅ Maintenance terminée:", stats);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Erreur de maintenance:", error);
      process.exit(1);
    });
}

module.exports = {
  runMaintenance,
  downgradeExpiredPremiumUsers,
  archiveOldLogs,
  cleanupExpiredTokens,
  generateQuotaReport,
};
