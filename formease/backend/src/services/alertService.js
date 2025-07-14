// Service d'alertes automatiques pour FormEase
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

const prisma = new PrismaClient();

// Configuration SMTP pour les alertes
const alertTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp1.o2switch.net",
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Configuration des seuils d'alerte
const ALERT_THRESHOLDS = {
  // Performance
  responseTime: {
    warning: 1000, // 1s
    critical: 3000, // 3s
  },
  errorRate: {
    warning: 1, // 1%
    critical: 5, // 5%
  },
  uptime: {
    warning: 99, // 99%
    critical: 95, // 95%
  },

  // Business
  conversionRate: {
    warning: 10, // 10%
    critical: 5, // 5%
  },
  churnRate: {
    warning: 10, // 10%
    critical: 20, // 20%
  },

  // Système
  diskUsage: {
    warning: 80, // 80%
    critical: 90, // 90%
  },
  memoryUsage: {
    warning: 80, // 80%
    critical: 90, // 90%
  },

  // Quotas
  quotaUsage: {
    warning: 80, // 80%
    critical: 95, // 95%
  },
};

// Types d'alertes
const ALERT_TYPES = {
  PERFORMANCE: "performance",
  BUSINESS: "business",
  SYSTEM: "system",
  SECURITY: "security",
  QUOTA: "quota",
};

// Niveaux de sévérité
const SEVERITY_LEVELS = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical",
};

class AlertService {
  constructor() {
    this.alerts = new Map(); // Cache des alertes actives
    this.lastCheck = new Date();
  }

  /**
   * Vérifier toutes les métriques et déclencher les alertes nécessaires
   */
  async checkAllMetrics() {
    try {
      logger.info("Starting alert check cycle");

      // Vérifications parallèles
      await Promise.all([
        this.checkPerformanceMetrics(),
        this.checkBusinessMetrics(),
        this.checkSystemMetrics(),
        this.checkSecurityMetrics(),
        this.checkQuotaMetrics(),
      ]);

      this.lastCheck = new Date();
      logger.info("Alert check cycle completed");
    } catch (error) {
      logger.error("Error in alert check cycle:", error);
    }
  }

  /**
   * Vérifier les métriques de performance
   */
  async checkPerformanceMetrics() {
    try {
      // Simuler la récupération des métriques de performance
      const metrics = await this.getPerformanceMetrics();

      // Temps de réponse
      if (metrics.avgResponseTime > ALERT_THRESHOLDS.responseTime.critical) {
        await this.triggerAlert({
          type: ALERT_TYPES.PERFORMANCE,
          severity: SEVERITY_LEVELS.CRITICAL,
          title: "Temps de réponse critique",
          message: `Temps de réponse moyen: ${metrics.avgResponseTime}ms (seuil: ${ALERT_THRESHOLDS.responseTime.critical}ms)`,
          metric: "response_time",
          value: metrics.avgResponseTime,
          threshold: ALERT_THRESHOLDS.responseTime.critical,
        });
      } else if (
        metrics.avgResponseTime > ALERT_THRESHOLDS.responseTime.warning
      ) {
        await this.triggerAlert({
          type: ALERT_TYPES.PERFORMANCE,
          severity: SEVERITY_LEVELS.WARNING,
          title: "Temps de réponse élevé",
          message: `Temps de réponse moyen: ${metrics.avgResponseTime}ms (seuil: ${ALERT_THRESHOLDS.responseTime.warning}ms)`,
          metric: "response_time",
          value: metrics.avgResponseTime,
          threshold: ALERT_THRESHOLDS.responseTime.warning,
        });
      }

      // Taux d'erreur
      if (metrics.errorRate > ALERT_THRESHOLDS.errorRate.critical) {
        await this.triggerAlert({
          type: ALERT_TYPES.PERFORMANCE,
          severity: SEVERITY_LEVELS.CRITICAL,
          title: "Taux d'erreur critique",
          message: `Taux d'erreur: ${metrics.errorRate}% (seuil: ${ALERT_THRESHOLDS.errorRate.critical}%)`,
          metric: "error_rate",
          value: metrics.errorRate,
          threshold: ALERT_THRESHOLDS.errorRate.critical,
        });
      }

      // Uptime
      if (metrics.uptime < ALERT_THRESHOLDS.uptime.critical) {
        await this.triggerAlert({
          type: ALERT_TYPES.PERFORMANCE,
          severity: SEVERITY_LEVELS.CRITICAL,
          title: "Uptime critique",
          message: `Uptime: ${metrics.uptime}% (seuil: ${ALERT_THRESHOLDS.uptime.critical}%)`,
          metric: "uptime",
          value: metrics.uptime,
          threshold: ALERT_THRESHOLDS.uptime.critical,
        });
      }
    } catch (error) {
      logger.error("Error checking performance metrics:", error);
    }
  }

  /**
   * Vérifier les métriques business
   */
  async checkBusinessMetrics() {
    try {
      const metrics = await this.getBusinessMetrics();

      // Taux de conversion
      if (metrics.conversionRate < ALERT_THRESHOLDS.conversionRate.critical) {
        await this.triggerAlert({
          type: ALERT_TYPES.BUSINESS,
          severity: SEVERITY_LEVELS.CRITICAL,
          title: "Taux de conversion critique",
          message: `Taux de conversion: ${metrics.conversionRate}% (seuil: ${ALERT_THRESHOLDS.conversionRate.critical}%)`,
          metric: "conversion_rate",
          value: metrics.conversionRate,
          threshold: ALERT_THRESHOLDS.conversionRate.critical,
        });
      }

      // Taux de churn
      if (metrics.churnRate > ALERT_THRESHOLDS.churnRate.critical) {
        await this.triggerAlert({
          type: ALERT_TYPES.BUSINESS,
          severity: SEVERITY_LEVELS.CRITICAL,
          title: "Taux de churn critique",
          message: `Taux de churn: ${metrics.churnRate}% (seuil: ${ALERT_THRESHOLDS.churnRate.critical}%)`,
          metric: "churn_rate",
          value: metrics.churnRate,
          threshold: ALERT_THRESHOLDS.churnRate.critical,
        });
      }

      // Revenus quotidiens
      if (metrics.dailyRevenue < metrics.expectedDailyRevenue * 0.5) {
        await this.triggerAlert({
          type: ALERT_TYPES.BUSINESS,
          severity: SEVERITY_LEVELS.WARNING,
          title: "Revenus quotidiens faibles",
          message: `Revenus du jour: ${metrics.dailyRevenue}€ (attendu: ${metrics.expectedDailyRevenue}€)`,
          metric: "daily_revenue",
          value: metrics.dailyRevenue,
          threshold: metrics.expectedDailyRevenue * 0.5,
        });
      }
    } catch (error) {
      logger.error("Error checking business metrics:", error);
    }
  }

  /**
   * Vérifier les métriques système
   */
  async checkSystemMetrics() {
    try {
      const metrics = await this.getSystemMetrics();

      // Utilisation disque
      if (metrics.diskUsage > ALERT_THRESHOLDS.diskUsage.critical) {
        await this.triggerAlert({
          type: ALERT_TYPES.SYSTEM,
          severity: SEVERITY_LEVELS.CRITICAL,
          title: "Espace disque critique",
          message: `Utilisation disque: ${metrics.diskUsage}% (seuil: ${ALERT_THRESHOLDS.diskUsage.critical}%)`,
          metric: "disk_usage",
          value: metrics.diskUsage,
          threshold: ALERT_THRESHOLDS.diskUsage.critical,
        });
      }

      // Utilisation mémoire
      if (metrics.memoryUsage > ALERT_THRESHOLDS.memoryUsage.critical) {
        await this.triggerAlert({
          type: ALERT_TYPES.SYSTEM,
          severity: SEVERITY_LEVELS.CRITICAL,
          title: "Mémoire critique",
          message: `Utilisation mémoire: ${metrics.memoryUsage}% (seuil: ${ALERT_THRESHOLDS.memoryUsage.critical}%)`,
          metric: "memory_usage",
          value: metrics.memoryUsage,
          threshold: ALERT_THRESHOLDS.memoryUsage.critical,
        });
      }

      // Connexions actives
      if (metrics.activeConnections > 1000) {
        await this.triggerAlert({
          type: ALERT_TYPES.SYSTEM,
          severity: SEVERITY_LEVELS.WARNING,
          title: "Nombre de connexions élevé",
          message: `Connexions actives: ${metrics.activeConnections} (seuil: 1000)`,
          metric: "active_connections",
          value: metrics.activeConnections,
          threshold: 1000,
        });
      }
    } catch (error) {
      logger.error("Error checking system metrics:", error);
    }
  }

  /**
   * Vérifier les métriques de sécurité
   */
  async checkSecurityMetrics() {
    try {
      const metrics = await this.getSecurityMetrics();

      // Tentatives de connexion échouées
      if (metrics.failedLogins > 50) {
        await this.triggerAlert({
          type: ALERT_TYPES.SECURITY,
          severity: SEVERITY_LEVELS.WARNING,
          title: "Tentatives de connexion suspectes",
          message: `${metrics.failedLogins} tentatives de connexion échouées dans la dernière heure`,
          metric: "failed_logins",
          value: metrics.failedLogins,
          threshold: 50,
        });
      }

      // Requêtes suspectes
      if (metrics.suspiciousRequests > 100) {
        await this.triggerAlert({
          type: ALERT_TYPES.SECURITY,
          severity: SEVERITY_LEVELS.CRITICAL,
          title: "Activité suspecte détectée",
          message: `${metrics.suspiciousRequests} requêtes suspectes détectées`,
          metric: "suspicious_requests",
          value: metrics.suspiciousRequests,
          threshold: 100,
        });
      }
    } catch (error) {
      logger.error("Error checking security metrics:", error);
    }
  }

  /**
   * Vérifier les métriques de quotas
   */
  async checkQuotaMetrics() {
    try {
      // Récupérer les utilisateurs approchant leurs limites
      const usersNearLimit = await prisma.user.findMany({
        where: {
          plan: "free",
        },
        include: {
          forms: {
            where: {
              archived: false,
            },
          },
        },
      });

      for (const user of usersNearLimit) {
        const formsCount = user.forms.length;
        const formsLimit = 1; // Limite FREE
        const usagePercentage = (formsCount / formsLimit) * 100;

        if (usagePercentage >= ALERT_THRESHOLDS.quotaUsage.warning) {
          await this.triggerAlert({
            type: ALERT_TYPES.QUOTA,
            severity:
              usagePercentage >= ALERT_THRESHOLDS.quotaUsage.critical
                ? SEVERITY_LEVELS.CRITICAL
                : SEVERITY_LEVELS.WARNING,
            title: "Utilisateur proche de ses limites",
            message: `Utilisateur ${
              user.email
            } utilise ${usagePercentage.toFixed(1)}% de ses quotas`,
            metric: "quota_usage",
            value: usagePercentage,
            threshold: ALERT_THRESHOLDS.quotaUsage.warning,
            userId: user.id,
          });
        }
      }
    } catch (error) {
      logger.error("Error checking quota metrics:", error);
    }
  }

  /**
   * Déclencher une alerte
   */
  async triggerAlert(alertData) {
    try {
      const alertKey = `${alertData.type}_${alertData.metric}_${alertData.severity}`;

      // Vérifier si l'alerte a déjà été envoyée récemment (éviter le spam)
      if (this.alerts.has(alertKey)) {
        const lastAlert = this.alerts.get(alertKey);
        const timeDiff = Date.now() - lastAlert.timestamp;

        // Ne pas renvoyer l'alerte si elle a été envoyée il y a moins de 30 minutes
        if (timeDiff < 30 * 60 * 1000) {
          return;
        }
      }

      // Enregistrer l'alerte en base
      const alert = await prisma.alert.create({
        data: {
          type: alertData.type,
          severity: alertData.severity,
          title: alertData.title,
          message: alertData.message,
          metric: alertData.metric,
          value: alertData.value,
          threshold: alertData.threshold,
          user_id: alertData.userId || null,
          status: "active",
        },
      });

      // Envoyer la notification email
      await this.sendAlertEmail(alertData);

      // Envoyer la notification Slack/Discord si configuré
      await this.sendSlackNotification(alertData);

      // Mettre en cache l'alerte
      this.alerts.set(alertKey, {
        id: alert.id,
        timestamp: Date.now(),
        data: alertData,
      });

      logger.info(`Alert triggered: ${alertData.title}`, {
        type: alertData.type,
        severity: alertData.severity,
        metric: alertData.metric,
        value: alertData.value,
      });
    } catch (error) {
      logger.error("Error triggering alert:", error);
    }
  }

  /**
   * Envoyer une alerte par email
   */
  async sendAlertEmail(alertData) {
    try {
      const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [
        "admin@formease.com",
      ];

      const subject = `[FormEase Alert - ${alertData.severity.toUpperCase()}] ${
        alertData.title
      }`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${this.getSeverityColor(
            alertData.severity
          )}; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🚨 Alerte FormEase</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">${alertData.severity.toUpperCase()}</p>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #333; margin-top: 0;">${alertData.title}</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">${
              alertData.message
            }</p>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Détails</h3>
              <ul style="color: #666;">
                <li><strong>Type:</strong> ${alertData.type}</li>
                <li><strong>Métrique:</strong> ${alertData.metric}</li>
                <li><strong>Valeur actuelle:</strong> ${alertData.value}</li>
                <li><strong>Seuil:</strong> ${alertData.threshold}</li>
                <li><strong>Heure:</strong> ${new Date().toLocaleString(
                  "fr-FR"
                )}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/admin" 
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Voir le Dashboard Admin
              </a>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
            FormEase - Système d'alertes automatiques
          </div>
        </div>
      `;

      for (const email of adminEmails) {
        await alertTransport.sendMail({
          from: process.env.SMTP_USER,
          to: email.trim(),
          subject,
          html,
        });
      }
    } catch (error) {
      logger.error("Error sending alert email:", error);
    }
  }

  /**
   * Envoyer une notification Slack
   */
  async sendSlackNotification(alertData) {
    try {
      const webhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (!webhookUrl) return;

      const color = this.getSeverityColor(alertData.severity);
      const emoji =
        alertData.severity === SEVERITY_LEVELS.CRITICAL ? "🚨" : "⚠️";

      const payload = {
        text: `${emoji} Alerte FormEase - ${alertData.severity.toUpperCase()}`,
        attachments: [
          {
            color: color,
            title: alertData.title,
            text: alertData.message,
            fields: [
              {
                title: "Type",
                value: alertData.type,
                short: true,
              },
              {
                title: "Métrique",
                value: alertData.metric,
                short: true,
              },
              {
                title: "Valeur",
                value: alertData.value.toString(),
                short: true,
              },
              {
                title: "Seuil",
                value: alertData.threshold.toString(),
                short: true,
              },
            ],
            footer: "FormEase Alert System",
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.statusText}`);
      }
    } catch (error) {
      logger.error("Error sending Slack notification:", error);
    }
  }

  /**
   * Obtenir la couleur selon la sévérité
   */
  getSeverityColor(severity) {
    switch (severity) {
      case SEVERITY_LEVELS.CRITICAL:
        return "#dc3545";
      case SEVERITY_LEVELS.WARNING:
        return "#ffc107";
      case SEVERITY_LEVELS.INFO:
        return "#17a2b8";
      default:
        return "#6c757d";
    }
  }

  /**
   * Récupérer les métriques de performance (simulation)
   */
  async getPerformanceMetrics() {
    // En production, ces métriques viendraient d'un système de monitoring réel
    return {
      avgResponseTime: Math.random() * 2000 + 200, // 200-2200ms
      errorRate: Math.random() * 3, // 0-3%
      uptime: 99.5 + Math.random() * 0.5, // 99.5-100%
    };
  }

  /**
   * Récupérer les métriques business (simulation)
   */
  async getBusinessMetrics() {
    const totalUsers = await prisma.user.count();
    const premiumUsers = await prisma.user.count({
      where: { plan: "premium" },
    });

    return {
      conversionRate: totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0,
      churnRate: Math.random() * 15, // 0-15%
      dailyRevenue: Math.random() * 1000 + 500, // 500-1500€
      expectedDailyRevenue: 800, // Objectif quotidien
    };
  }

  /**
   * Récupérer les métriques système (simulation)
   */
  async getSystemMetrics() {
    return {
      diskUsage: Math.random() * 100, // 0-100%
      memoryUsage: Math.random() * 100, // 0-100%
      activeConnections: Math.floor(Math.random() * 200 + 50), // 50-250
    };
  }

  /**
   * Récupérer les métriques de sécurité (simulation)
   */
  async getSecurityMetrics() {
    return {
      failedLogins: Math.floor(Math.random() * 100), // 0-100
      suspiciousRequests: Math.floor(Math.random() * 50), // 0-50
    };
  }

  /**
   * Résoudre une alerte
   */
  async resolveAlert(alertId, resolution) {
    try {
      await prisma.alert.update({
        where: { id: alertId },
        data: {
          status: "resolved",
          resolution,
          resolved_at: new Date(),
        },
      });

      logger.info(`Alert resolved: ${alertId}`, { resolution });
    } catch (error) {
      logger.error("Error resolving alert:", error);
    }
  }

  /**
   * Obtenir les alertes actives
   */
  async getActiveAlerts() {
    try {
      return await prisma.alert.findMany({
        where: { status: "active" },
        orderBy: { created_at: "desc" },
        take: 50,
      });
    } catch (error) {
      logger.error("Error getting active alerts:", error);
      return [];
    }
  }

  /**
   * Nettoyer les anciennes alertes
   */
  async cleanupOldAlerts() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deleted = await prisma.alert.deleteMany({
        where: {
          created_at: {
            lt: thirtyDaysAgo,
          },
          status: "resolved",
        },
      });

      logger.info(`Cleaned up ${deleted.count} old alerts`);
    } catch (error) {
      logger.error("Error cleaning up old alerts:", error);
    }
  }
}

module.exports = new AlertService();
