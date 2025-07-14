const { PrismaClient } = require("@prisma/client");
const winston = require("winston");

const prisma = new PrismaClient();
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/monitoring.log" }),
  ],
});

class MonitoringService {
  /**
   * Calcule les métriques de conversion FREE → PREMIUM
   */
  async getConversionMetrics(timeframe = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate - timeframe * 24 * 60 * 60 * 1000);

      // Utilisateurs créés dans la période
      const newUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Utilisateurs FREE dans la période
      const freeUsers = await prisma.user.count({
        where: {
          role: "USER",
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Conversions FREE → PREMIUM dans la période
      const conversions = await prisma.user.count({
        where: {
          role: "PREMIUM",
          updatedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Taux de conversion
      const conversionRate =
        freeUsers > 0 ? (conversions / freeUsers) * 100 : 0;

      // Revenus générés par les conversions
      const conversionRevenue = conversions * 12; // 12€ par conversion

      return {
        timeframe,
        newUsers,
        freeUsers,
        conversions,
        conversionRate: Math.round(conversionRate * 100) / 100,
        conversionRevenue,
        period: {
          start: startDate,
          end: endDate,
        },
      };
    } catch (error) {
      logger.error("Erreur calcul métriques conversion:", error);
      throw error;
    }
  }

  /**
   * Calcule les métriques de churn (désabonnements)
   */
  async getChurnMetrics(timeframe = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate - timeframe * 24 * 60 * 60 * 1000);

      // Utilisateurs PREMIUM au début de la période
      const premiumUsersStart = await prisma.user.count({
        where: {
          role: "PREMIUM",
          createdAt: {
            lt: startDate,
          },
        },
      });

      // Utilisateurs qui ont été downgradés (PREMIUM → USER)
      const downgrades = await prisma.user.count({
        where: {
          role: "USER",
          updatedAt: {
            gte: startDate,
            lte: endDate,
          },
          // Utilisateurs qui étaient PREMIUM avant
          planExpiration: {
            lt: endDate,
          },
        },
      });

      // Taux de churn
      const churnRate =
        premiumUsersStart > 0 ? (downgrades / premiumUsersStart) * 100 : 0;

      // Revenus perdus
      const lostRevenue = downgrades * 12; // 12€ par churn

      return {
        timeframe,
        premiumUsersStart,
        downgrades,
        churnRate: Math.round(churnRate * 100) / 100,
        lostRevenue,
        period: {
          start: startDate,
          end: endDate,
        },
      };
    } catch (error) {
      logger.error("Erreur calcul métriques churn:", error);
      throw error;
    }
  }

  /**
   * Calcule la Customer Lifetime Value (LTV)
   */
  async getLTVMetrics() {
    try {
      // Revenus moyens par utilisateur PREMIUM
      const avgMonthlyRevenue = 12; // 12€/mois

      // Durée moyenne d'abonnement (en mois)
      const premiumUsers = await prisma.user.findMany({
        where: {
          role: "PREMIUM",
          planExpiration: {
            not: null,
          },
        },
        select: {
          createdAt: true,
          updatedAt: true,
          planExpiration: true,
        },
      });

      let totalLifetimeMonths = 0;
      let activeUsers = 0;

      premiumUsers.forEach((user) => {
        const subscriptionStart = user.updatedAt; // Date de passage PREMIUM
        const subscriptionEnd = user.planExpiration;

        if (subscriptionStart && subscriptionEnd) {
          const lifetimeMonths =
            (subscriptionEnd - subscriptionStart) / (1000 * 60 * 60 * 24 * 30);
          totalLifetimeMonths += lifetimeMonths;
          activeUsers++;
        }
      });

      const avgLifetimeMonths =
        activeUsers > 0 ? totalLifetimeMonths / activeUsers : 1;
      const ltv = avgMonthlyRevenue * avgLifetimeMonths;

      return {
        avgMonthlyRevenue,
        avgLifetimeMonths: Math.round(avgLifetimeMonths * 100) / 100,
        ltv: Math.round(ltv * 100) / 100,
        activeUsers,
        totalPremiumUsers: premiumUsers.length,
      };
    } catch (error) {
      logger.error("Erreur calcul LTV:", error);
      throw error;
    }
  }

  /**
   * Calcule les métriques de revenus (MRR, ARR)
   */
  async getRevenueMetrics() {
    try {
      const currentDate = new Date();

      // Utilisateurs PREMIUM actifs
      const activePremiumUsers = await prisma.user.count({
        where: {
          role: "PREMIUM",
          planExpiration: {
            gt: currentDate,
          },
        },
      });

      // Monthly Recurring Revenue
      const mrr = activePremiumUsers * 12;

      // Annual Recurring Revenue
      const arr = mrr * 12;

      // Croissance MRR (comparaison mois précédent)
      const lastMonth = new Date(currentDate - 30 * 24 * 60 * 60 * 1000);
      const lastMonthPremium = await prisma.user.count({
        where: {
          role: "PREMIUM",
          planExpiration: {
            gt: lastMonth,
          },
          updatedAt: {
            lt: lastMonth,
          },
        },
      });

      const lastMonthMRR = lastMonthPremium * 12;
      const mrrGrowth =
        lastMonthMRR > 0 ? ((mrr - lastMonthMRR) / lastMonthMRR) * 100 : 0;

      return {
        activePremiumUsers,
        mrr,
        arr,
        lastMonthMRR,
        mrrGrowth: Math.round(mrrGrowth * 100) / 100,
        revenuePerUser: 12,
        period: currentDate,
      };
    } catch (error) {
      logger.error("Erreur calcul métriques revenus:", error);
      throw error;
    }
  }

  /**
   * Calcule les métriques d'engagement utilisateur
   */
  async getEngagementMetrics(timeframe = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate - timeframe * 24 * 60 * 60 * 1000);

      // Utilisateurs actifs (qui ont créé/modifié des formulaires)
      const activeUsers = await prisma.user.count({
        where: {
          forms: {
            some: {
              updatedAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      });

      // Formulaires créés dans la période
      const formsCreated = await prisma.form.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Soumissions reçues dans la période
      const submissionsReceived = await prisma.submission.count({
        where: {
          submittedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Utilisateurs totaux
      const totalUsers = await prisma.user.count();

      // Taux d'engagement
      const engagementRate =
        totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

      return {
        timeframe,
        activeUsers,
        totalUsers,
        engagementRate: Math.round(engagementRate * 100) / 100,
        formsCreated,
        submissionsReceived,
        avgFormsPerUser:
          activeUsers > 0
            ? Math.round((formsCreated / activeUsers) * 100) / 100
            : 0,
        period: {
          start: startDate,
          end: endDate,
        },
      };
    } catch (error) {
      logger.error("Erreur calcul métriques engagement:", error);
      throw error;
    }
  }

  /**
   * Génère un rapport complet des métriques business
   */
  async getBusinessMetricsReport(timeframe = 30) {
    try {
      const [conversion, churn, ltv, revenue, engagement] = await Promise.all([
        this.getConversionMetrics(timeframe),
        this.getChurnMetrics(timeframe),
        this.getLTVMetrics(),
        this.getRevenueMetrics(),
        this.getEngagementMetrics(timeframe),
      ]);

      const report = {
        timestamp: new Date(),
        timeframe,
        metrics: {
          conversion,
          churn,
          ltv,
          revenue,
          engagement,
        },
        summary: {
          health_score: this.calculateHealthScore(
            conversion,
            churn,
            engagement
          ),
          key_insights: this.generateKeyInsights(
            conversion,
            churn,
            ltv,
            revenue,
            engagement
          ),
        },
      };

      // Log du rapport
      logger.info("Rapport métriques business généré", {
        timestamp: report.timestamp,
        health_score: report.summary.health_score,
      });

      return report;
    } catch (error) {
      logger.error("Erreur génération rapport business:", error);
      throw error;
    }
  }

  /**
   * Calcule un score de santé global de la plateforme
   */
  calculateHealthScore(conversion, churn, engagement) {
    let score = 0;

    // Score conversion (0-40 points)
    if (conversion.conversionRate >= 15) score += 40;
    else if (conversion.conversionRate >= 10) score += 30;
    else if (conversion.conversionRate >= 5) score += 20;
    else score += 10;

    // Score churn (0-30 points)
    if (churn.churnRate <= 5) score += 30;
    else if (churn.churnRate <= 10) score += 20;
    else if (churn.churnRate <= 15) score += 10;
    else score += 0;

    // Score engagement (0-30 points)
    if (engagement.engagementRate >= 50) score += 30;
    else if (engagement.engagementRate >= 30) score += 20;
    else if (engagement.engagementRate >= 15) score += 10;
    else score += 0;

    return Math.min(100, score);
  }

  /**
   * Génère des insights clés basés sur les métriques
   */
  generateKeyInsights(conversion, churn, ltv, revenue, engagement) {
    const insights = [];

    // Insights conversion
    if (conversion.conversionRate < 10) {
      insights.push({
        type: "warning",
        category: "conversion",
        message: `Taux de conversion faible (${conversion.conversionRate}%). Optimiser l'onboarding et les CTA.`,
      });
    } else if (conversion.conversionRate > 20) {
      insights.push({
        type: "success",
        category: "conversion",
        message: `Excellent taux de conversion (${conversion.conversionRate}%). Maintenir la stratégie actuelle.`,
      });
    }

    // Insights churn
    if (churn.churnRate > 10) {
      insights.push({
        type: "critical",
        category: "churn",
        message: `Taux de churn élevé (${churn.churnRate}%). Améliorer la rétention et le support.`,
      });
    }

    // Insights revenus
    if (revenue.mrrGrowth < 0) {
      insights.push({
        type: "warning",
        category: "revenue",
        message: `MRR en baisse (${revenue.mrrGrowth}%). Analyser les causes et agir rapidement.`,
      });
    } else if (revenue.mrrGrowth > 20) {
      insights.push({
        type: "success",
        category: "revenue",
        message: `Forte croissance MRR (${revenue.mrrGrowth}%). Excellent momentum business.`,
      });
    }

    // Insights engagement
    if (engagement.engagementRate < 20) {
      insights.push({
        type: "warning",
        category: "engagement",
        message: `Engagement faible (${engagement.engagementRate}%). Améliorer l'expérience utilisateur.`,
      });
    }

    return insights;
  }

  /**
   * Vérifie les seuils d'alerte et génère des alertes
   */
  async checkAlerts() {
    try {
      const metrics = await this.getBusinessMetricsReport(7); // 7 jours
      const alerts = [];

      // Alertes critiques
      if (metrics.metrics.churn.churnRate > 15) {
        alerts.push({
          level: "critical",
          type: "churn",
          message: `Taux de churn critique: ${metrics.metrics.churn.churnRate}%`,
          value: metrics.metrics.churn.churnRate,
          threshold: 15,
        });
      }

      if (metrics.metrics.revenue.mrrGrowth < -10) {
        alerts.push({
          level: "critical",
          type: "revenue",
          message: `MRR en forte baisse: ${metrics.metrics.revenue.mrrGrowth}%`,
          value: metrics.metrics.revenue.mrrGrowth,
          threshold: -10,
        });
      }

      // Alertes warning
      if (metrics.metrics.conversion.conversionRate < 5) {
        alerts.push({
          level: "warning",
          type: "conversion",
          message: `Taux de conversion faible: ${metrics.metrics.conversion.conversionRate}%`,
          value: metrics.metrics.conversion.conversionRate,
          threshold: 5,
        });
      }

      if (metrics.metrics.engagement.engagementRate < 15) {
        alerts.push({
          level: "warning",
          type: "engagement",
          message: `Engagement utilisateur faible: ${metrics.metrics.engagement.engagementRate}%`,
          value: metrics.metrics.engagement.engagementRate,
          threshold: 15,
        });
      }

      // Log des alertes
      if (alerts.length > 0) {
        logger.warn("Alertes business détectées", { alerts });
      }

      return alerts;
    } catch (error) {
      logger.error("Erreur vérification alertes:", error);
      throw error;
    }
  }
}

module.exports = new MonitoringService();
