#!/usr/bin/env node

/**
 * Script d'alertes automatiques pour le monitoring business
 * Vérifie les métriques critiques et envoie des notifications
 */

const monitoringService = require("../services/monitoringService");
const alertService = require("../services/alertService");
const winston = require("winston");
const nodemailer = require("nodemailer");

// Configuration du logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/monitoring-alerts.log" }),
    new winston.transports.Console(),
  ],
});

// Configuration email pour les alertes
const emailConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const transporter = nodemailer.createTransporter(emailConfig);

/**
 * Envoie une notification email pour les alertes critiques
 */
async function sendAlertEmail(alerts) {
  try {
    if (!process.env.ALERT_EMAIL_TO) {
      logger.warn("ALERT_EMAIL_TO non configuré, email non envoyé");
      return;
    }

    const criticalAlerts = alerts.filter((alert) => alert.level === "critical");
    if (criticalAlerts.length === 0) {
      return;
    }

    const subject = `[FORMEASE] ${criticalAlerts.length} Alerte(s) Critique(s) Détectée(s)`;

    let html = `
      <h2>🚨 Alertes Critiques FormEase</h2>
      <p><strong>Timestamp:</strong> ${new Date().toLocaleString("fr-FR")}</p>
      <p><strong>Nombre d'alertes:</strong> ${criticalAlerts.length}</p>
      <hr>
    `;

    criticalAlerts.forEach((alert, index) => {
      html += `
        <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #dc2626; background-color: #fef2f2;">
          <h3 style="color: #dc2626; margin: 0 0 10px 0;">
            ${alert.type.toUpperCase()} - ${alert.level.toUpperCase()}
          </h3>
          <p style="margin: 5px 0;"><strong>Message:</strong> ${
            alert.message
          }</p>
          <p style="margin: 5px 0;"><strong>Valeur actuelle:</strong> ${
            alert.value
          }</p>
          <p style="margin: 5px 0;"><strong>Seuil:</strong> ${
            alert.threshold
          }</p>
        </div>
      `;
    });

    html += `
      <hr>
      <p style="color: #666; font-size: 12px;">
        Ce message a été généré automatiquement par le système de monitoring FormEase.
        <br>
        Pour désactiver ces alertes, contactez l'administrateur système.
      </p>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@formease.com",
      to: process.env.ALERT_EMAIL_TO,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email d'alerte envoyé à ${process.env.ALERT_EMAIL_TO}`, {
      criticalAlerts: criticalAlerts.length,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Erreur envoi email d'alerte:", error);
  }
}

/**
 * Envoie une notification Slack/Discord (webhook)
 */
async function sendWebhookAlert(alerts) {
  try {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (!webhookUrl) {
      return;
    }

    const criticalAlerts = alerts.filter((alert) => alert.level === "critical");
    const warningAlerts = alerts.filter((alert) => alert.level === "warning");

    if (alerts.length === 0) {
      return;
    }

    let message = `🚨 **Alertes FormEase** - ${new Date().toLocaleString(
      "fr-FR"
    )}\n\n`;

    if (criticalAlerts.length > 0) {
      message += `🔴 **${criticalAlerts.length} Alerte(s) Critique(s):**\n`;
      criticalAlerts.forEach((alert) => {
        message += `• **${alert.type.toUpperCase()}**: ${alert.message}\n`;
      });
      message += "\n";
    }

    if (warningAlerts.length > 0) {
      message += `🟡 **${warningAlerts.length} Avertissement(s):**\n`;
      warningAlerts.forEach((alert) => {
        message += `• **${alert.type.toUpperCase()}**: ${alert.message}\n`;
      });
    }

    const payload = {
      text: message,
      username: "FormEase Monitoring",
      icon_emoji: ":warning:",
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      logger.info("Notification webhook envoyée", {
        alerts: alerts.length,
        critical: criticalAlerts.length,
        warning: warningAlerts.length,
      });
    } else {
      logger.error("Erreur envoi webhook:", response.statusText);
    }
  } catch (error) {
    logger.error("Erreur envoi webhook:", error);
  }
}

/**
 * Génère un rapport de santé quotidien
 */
async function generateHealthReport() {
  try {
    const report = await monitoringService.getBusinessMetricsReport(7); // 7 jours

    const healthReport = {
      timestamp: new Date(),
      health_score: report.summary.health_score,
      status:
        report.summary.health_score >= 70
          ? "healthy"
          : report.summary.health_score >= 50
          ? "warning"
          : "critical",
      key_metrics: {
        conversion_rate: report.metrics.conversion.conversionRate,
        churn_rate: report.metrics.churn.churnRate,
        mrr: report.metrics.revenue.mrr,
        mrr_growth: report.metrics.revenue.mrrGrowth,
        engagement_rate: report.metrics.engagement.engagementRate,
        active_premium_users: report.metrics.revenue.activePremiumUsers,
      },
      insights: report.summary.key_insights,
    };

    logger.info("Rapport de santé généré", healthReport);
    return healthReport;
  } catch (error) {
    logger.error("Erreur génération rapport de santé:", error);
    throw error;
  }
}

/**
 * Fonction principale de vérification des alertes
 */
async function checkAndNotifyAlerts() {
  try {
    logger.info("🔍 Vérification des alertes business...");

    // Utiliser le nouveau service d'alertes
    const result = await alertService.checkAllAlerts();

    if (result.count === 0) {
      logger.info("✅ Aucune alerte détectée");
      return;
    }

    logger.warn(`⚠️ ${result.count} alerte(s) détectée(s)`, {
      critical: result.alerts.filter((a) => a.severity === "critical").length,
      warning: result.alerts.filter((a) => a.severity === "warning").length,
    });

    logger.info(
      "📧 Notifications d'alerte envoyées automatiquement par le service"
    );
  } catch (error) {
    logger.error("Erreur lors de la vérification des alertes:", error);
    process.exit(1);
  }
}

/**
 * Fonction principale pour le rapport de santé
 */
async function generateAndSendHealthReport() {
  try {
    logger.info("📊 Génération du rapport de santé...");

    const healthReport = await generateHealthReport();

    // Envoyer le rapport par email si configuré
    if (process.env.HEALTH_REPORT_EMAIL) {
      await sendHealthReportEmail(healthReport);
    }

    logger.info("📋 Rapport de santé généré avec succès");
  } catch (error) {
    logger.error("Erreur génération rapport de santé:", error);
    process.exit(1);
  }
}

/**
 * Envoie le rapport de santé par email
 */
async function sendHealthReportEmail(report) {
  try {
    if (!process.env.HEALTH_REPORT_EMAIL) {
      return;
    }

    const subject = `[FORMEASE] Rapport de Santé Quotidien - Score: ${report.health_score}/100`;

    let html = `
      <h2>📊 Rapport de Santé FormEase</h2>
      <p><strong>Date:</strong> ${report.timestamp.toLocaleString("fr-FR")}</p>
      <p><strong>Score de santé:</strong> ${
        report.health_score
      }/100 (${report.status.toUpperCase()})</p>
      <hr>
      
      <h3>Métriques Clés (7 jours)</h3>
      <ul>
        <li><strong>Taux de conversion:</strong> ${
          report.key_metrics.conversion_rate
        }%</li>
        <li><strong>Taux de churn:</strong> ${
          report.key_metrics.churn_rate
        }%</li>
        <li><strong>MRR:</strong> ${report.key_metrics.mrr}€</li>
        <li><strong>Croissance MRR:</strong> ${
          report.key_metrics.mrr_growth
        }%</li>
        <li><strong>Engagement:</strong> ${
          report.key_metrics.engagement_rate
        }%</li>
        <li><strong>Utilisateurs Premium:</strong> ${
          report.key_metrics.active_premium_users
        }</li>
      </ul>
      
      <h3>Insights</h3>
    `;

    report.insights.forEach((insight) => {
      const color =
        insight.type === "success"
          ? "#10b981"
          : insight.type === "warning"
          ? "#f59e0b"
          : "#dc2626";
      html += `
        <div style="margin: 10px 0; padding: 10px; border-left: 4px solid ${color}; background-color: #f9fafb;">
          <strong>${insight.category.toUpperCase()}:</strong> ${insight.message}
        </div>
      `;
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@formease.com",
      to: process.env.HEALTH_REPORT_EMAIL,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Rapport de santé envoyé à ${process.env.HEALTH_REPORT_EMAIL}`);
  } catch (error) {
    logger.error("Erreur envoi rapport de santé:", error);
  }
}

// Gestion des arguments de ligne de commande
const command = process.argv[2];

switch (command) {
  case "check-alerts":
    checkAndNotifyAlerts();
    break;
  case "health-report":
    generateAndSendHealthReport();
    break;
  case "both":
    Promise.all([checkAndNotifyAlerts(), generateAndSendHealthReport()]);
    break;
  default:
    console.log(`
Usage: node monitoringAlerts.js <command>

Commands:
  check-alerts    Vérifie les alertes et envoie des notifications
  health-report   Génère et envoie le rapport de santé
  both           Exécute les deux commandes

Variables d'environnement:
  ALERT_EMAIL_TO        Email pour les alertes critiques
  HEALTH_REPORT_EMAIL   Email pour le rapport de santé quotidien
  ALERT_WEBHOOK_URL     URL webhook pour notifications (Slack/Discord)
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS  Configuration email
    `);
    process.exit(1);
}

module.exports = {
  checkAndNotifyAlerts,
  generateHealthReport,
  sendAlertEmail,
  sendWebhookAlert,
};
