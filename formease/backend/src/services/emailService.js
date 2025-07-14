/**
 * 📧 SERVICE EMAIL - FormEase
 * Gestion complète de l'envoi d'emails
 * Supporté: SendGrid, MailerSend, Nodemailer
 */

const logger = require("../utils/logger");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

class EmailService {
  constructor() {
    this.providers = {
      sendgrid: null,
      mailersend: null,
      nodemailer: null,
    };

    this.activeProvider = process.env.EMAIL_PROVIDER || "sendgrid";
    this.initializeProviders();
  }

  /**
   * 🔧 Initialisation des fournisseurs d'email
   */
  initializeProviders() {
    try {
      // Configuration SendGrid
      if (process.env.SENDGRID_API_KEY) {
        const sgMail = require("@sendgrid/mail");
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        this.providers.sendgrid = sgMail;
        logger.info("SendGrid email provider initialized");
      }

      // Configuration MailerSend (optionnel)
      if (process.env.MAILERSEND_API_KEY) {
        try {
          const { MailerSend } = require("mailersend");
          this.providers.mailersend = new MailerSend({
            apiKey: process.env.MAILERSEND_API_KEY,
          });
          logger.info("MailerSend email provider initialized");
        } catch (error) {
          logger.warn("MailerSend module not found, skipping initialization");
        }
      }

      // Configuration Nodemailer (SMTP) - Provider par défaut
      if (
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      ) {
        const nodemailer = require("nodemailer");
        this.providers.nodemailer = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === "true", // true pour port 465
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          // Configuration TLS
          tls: {
            rejectUnauthorized:
              process.env.SMTP_REJECT_UNAUTHORIZED !== "false",
          },
        });
        logger.info("Nodemailer SMTP provider initialized");
      } else {
        // Configuration SMTP par défaut pour développement
        const nodemailer = require("nodemailer");
        this.providers.nodemailer = nodemailer.createTransport({
          host: "localhost",
          port: 1025,
          secure: false,
          auth: false,
          // Pour MailHog ou autre serveur SMTP de développement
        });
        logger.info("Nodemailer SMTP provider initialized (development mode)");
      }

      // Définir le provider par défaut
      this.activeProvider = process.env.EMAIL_PROVIDER || "nodemailer";

      // Vérifier qu'au moins un provider est disponible
      if (Object.keys(this.providers).length === 0) {
        throw new Error("Aucun fournisseur d'email configuré");
      }
    } catch (error) {
      logger.error(
        "Erreur lors de l'initialisation des providers email:",
        error
      );
      // Ne pas lancer d'erreur, permettre au serveur de démarrer
    }
  }

  /**
   * 📧 Envoyer un email unique
   */
  async sendEmail({
    to,
    subject,
    html,
    text,
    from,
    campaignId = null,
    userId = null,
    metadata = {},
  }) {
    try {
      // Validation des données
      const validation = this.validateEmailData({
        to,
        subject,
        html: html || text,
      });
      if (!validation.isValid) {
        throw new Error(
          `Données email invalides: ${validation.errors.join(", ")}`
        );
      }

      // Configuration de l'expéditeur
      const fromAddress =
        from || process.env.EMAIL_FROM || "noreply@formease.com";
      const fromName = process.env.EMAIL_FROM_NAME || "FormEase";

      // Préparer les données email
      const emailData = {
        to: Array.isArray(to) ? to : [to],
        from: { email: fromAddress, name: fromName },
        subject,
        html: html || text,
        text: text || this.stripHtml(html),
      };

      // Envoyer selon le provider actif
      let result;
      switch (this.activeProvider) {
        case "sendgrid":
          result = await this.sendViaSendGrid(emailData);
          break;
        case "mailersend":
          result = await this.sendViaMailerSend(emailData);
          break;
        case "nodemailer":
          result = await this.sendViaNodemailer(emailData);
          break;
        default:
          throw new Error(
            `Provider email non supporté: ${this.activeProvider}`
          );
      }

      // Enregistrer en base de données
      const emailRecord = await this.saveEmailRecord({
        to: Array.isArray(to) ? to[0] : to,
        subject,
        html: html || text,
        campaignId,
        userId,
        provider: this.activeProvider,
        providerId: result.messageId || result.id,
        status: "sent",
        metadata,
      });

      logger.info(
        `Email envoyé avec succès à ${Array.isArray(to) ? to[0] : to}`,
        {
          emailId: emailRecord.id,
          provider: this.activeProvider,
          campaignId,
        }
      );

      return {
        success: true,
        emailId: emailRecord.id,
        providerId: result.messageId || result.id,
        message: "Email envoyé avec succès",
      };
    } catch (error) {
      logger.error("Erreur lors de l'envoi email:", error);

      // Enregistrer l'échec en base
      if (to && subject) {
        await this.saveEmailRecord({
          to: Array.isArray(to) ? to[0] : to,
          subject,
          html: html || text,
          campaignId,
          userId,
          provider: this.activeProvider,
          status: "failed",
          error: error.message,
          metadata,
        }).catch((dbError) => {
          logger.error(
            "Erreur lors de l'enregistrement de l'échec email:",
            dbError
          );
        });
      }

      throw error;
    }
  }

  /**
   * 📧 Envoyer des emails en lot
   */
  async sendBulkEmails({
    recipients,
    subject,
    html,
    text,
    from,
    campaignId = null,
    userId = null,
    metadata = {},
  }) {
    const results = [];
    const errors = [];

    logger.info(
      `Début d'envoi email en lot pour ${recipients.length} destinataires`
    );

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];

      try {
        // Personnaliser le contenu avec les variables
        const personalizedHtml = this.personalizeContent(html, recipient);
        const personalizedText = text
          ? this.personalizeContent(text, recipient)
          : null;

        const result = await this.sendEmail({
          to: recipient.email,
          subject: this.personalizeContent(subject, recipient),
          html: personalizedHtml,
          text: personalizedText,
          from,
          campaignId,
          userId,
          metadata: {
            ...metadata,
            bulkIndex: i,
            bulkTotal: recipients.length,
            recipientData: recipient,
          },
        });

        results.push({
          email: recipient.email,
          success: true,
          emailId: result.emailId,
          providerId: result.providerId,
        });
      } catch (error) {
        errors.push({
          email: recipient.email,
          success: false,
          error: error.message,
        });

        logger.error(`Erreur email pour ${recipient.email}:`, error);
      }

      // Pause entre les envois pour éviter le rate limiting
      if (i < recipients.length - 1) {
        await this.delay(200); // 200ms de pause
      }
    }

    logger.info(
      `Envoi email en lot terminé: ${results.length} succès, ${errors.length} échecs`
    );

    return {
      success: errors.length === 0,
      totalSent: results.length,
      totalFailed: errors.length,
      results,
      errors,
    };
  }

  /**
   * 📧 Envoyer via SendGrid
   */
  async sendViaSendGrid(emailData) {
    if (!this.providers.sendgrid) {
      throw new Error("SendGrid non configuré");
    }

    const msg = {
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    };

    const [result] = await this.providers.sendgrid.send(msg);
    return result;
  }

  /**
   * 📧 Envoyer via MailerSend
   */
  async sendViaMailerSend(emailData) {
    if (!this.providers.mailersend) {
      throw new Error("MailerSend non configuré");
    }

    const { EmailParams, Sender, Recipient } = require("mailersend");

    const sentFrom = new Sender(emailData.from.email, emailData.from.name);
    const recipients = emailData.to.map((email) => new Recipient(email));

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(emailData.subject)
      .setHtml(emailData.html)
      .setText(emailData.text);

    const result = await this.providers.mailersend.email.send(emailParams);
    return result;
  }

  /**
   * 📧 Envoyer via Nodemailer
   */
  async sendViaNodemailer(emailData) {
    if (!this.providers.nodemailer) {
      throw new Error("Nodemailer non configuré");
    }

    const mailOptions = {
      from: `"${emailData.from.name}" <${emailData.from.email}>`,
      to: emailData.to.join(", "),
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    };

    const result = await this.providers.nodemailer.sendMail(mailOptions);
    return result;
  }

  /**
   * 🔧 Validation des données email
   */
  validateEmailData({ to, subject, html }) {
    const errors = [];

    if (!to || (Array.isArray(to) && to.length === 0)) {
      errors.push("Destinataire requis");
    } else {
      const emails = Array.isArray(to) ? to : [to];
      emails.forEach((email) => {
        if (!this.isValidEmail(email)) {
          errors.push(`Format d'email invalide: ${email}`);
        }
      });
    }

    if (!subject || subject.trim().length === 0) {
      errors.push("Objet requis");
    }

    if (!html || html.trim().length === 0) {
      errors.push("Contenu requis");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * ✅ Validation du format email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 🎭 Personnaliser le contenu avec les variables
   */
  personalizeContent(template, data) {
    let content = template;

    // Variables disponibles
    const variables = {
      "{{first_name}}": data.first_name || data.firstName || "",
      "{{last_name}}": data.last_name || data.lastName || "",
      "{{email}}": data.email || "",
      "{{company}}": data.company || data.entreprise || "",
      "{{city}}": data.city || data.ville || "",
      "{{country}}": data.country || data.pays || "",
      "{{date}}": new Date().toLocaleDateString("fr-FR"),
      "{{time}}": new Date().toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Remplacer toutes les variables
    Object.entries(variables).forEach(([variable, value]) => {
      content = content.replace(new RegExp(variable, "g"), value);
    });

    return content;
  }

  /**
   * 🧹 Supprimer les balises HTML
   */
  stripHtml(html) {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "");
  }

  /**
   * 💾 Enregistrer l'email en base de données
   */
  async saveEmailRecord(data) {
    try {
      return await prisma.emailLog.create({
        data: {
          user_id: data.userId,
          campaign_id: data.campaignId,
          recipient_email: data.to,
          subject: data.subject,
          content: data.html,
          provider: data.provider,
          provider_id: data.providerId,
          status: data.status,
          error_message: data.error,
          metadata: data.metadata || {},
          sent_at: data.status === "sent" ? new Date() : null,
        },
      });
    } catch (error) {
      logger.error("Erreur lors de l'enregistrement email:", error);
      throw error;
    }
  }

  /**
   * 📊 Obtenir les statistiques email
   */
  async getEmailStats(userId = null, campaignId = null, period = "30d") {
    try {
      const dateFilter = this.getDateFilter(period);
      const whereClause = {
        sent_at: dateFilter,
        ...(userId && { user_id: userId }),
        ...(campaignId && { campaign_id: campaignId }),
      };

      const [stats, openStats, clickStats] = await Promise.all([
        prisma.emailLog.groupBy({
          by: ["status"],
          where: whereClause,
          _count: { id: true },
        }),
        prisma.emailLog.count({
          where: { ...whereClause, opened_at: { not: null } },
        }),
        prisma.emailLog.count({
          where: { ...whereClause, clicked_at: { not: null } },
        }),
      ]);

      const totalSent = stats.find((s) => s.status === "sent")?._count.id || 0;
      const totalFailed =
        stats.find((s) => s.status === "failed")?._count.id || 0;
      const totalPending =
        stats.find((s) => s.status === "pending")?._count.id || 0;

      return {
        totalSent,
        totalFailed,
        totalPending,
        totalOpened: openStats,
        totalClicked: clickStats,
        total: totalSent + totalFailed + totalPending,
        deliveryRate:
          totalSent + totalFailed > 0
            ? (totalSent / (totalSent + totalFailed)) * 100
            : 0,
        openRate: totalSent > 0 ? (openStats / totalSent) * 100 : 0,
        clickRate: totalSent > 0 ? (clickStats / totalSent) * 100 : 0,
      };
    } catch (error) {
      logger.error("Erreur lors de la récupération des stats email:", error);
      throw error;
    }
  }

  /**
   * 📅 Obtenir le filtre de date
   */
  getDateFilter(period) {
    const now = new Date();
    const periodMap = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1y": 365,
    };

    const days = periodMap[period] || 30;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    return { gte: startDate };
  }

  /**
   * ⏱️ Fonction de délai
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 📧 Envoyer un email de notification système
   */
  async sendSystemNotification(to, type, data = {}) {
    const templates = {
      welcome: {
        subject: "Bienvenue sur FormEase !",
        html: `
          <h2>Bienvenue {{first_name}} !</h2>
          <p>Votre compte FormEase a été créé avec succès.</p>
          <p>Vous pouvez maintenant créer vos premiers formulaires.</p>
        `,
      },
      form_submission: {
        subject: "Nouvelle soumission de formulaire",
        html: `
          <h2>Nouvelle soumission</h2>
          <p>Votre formulaire "{{form_title}}" a reçu une nouvelle soumission.</p>
          <p>Connectez-vous à votre dashboard pour voir les détails.</p>
        `,
      },
      quota_warning: {
        subject: "Attention : Quota bientôt atteint",
        html: `
          <h2>Quota d'emails</h2>
          <p>Vous avez utilisé {{used_count}} emails sur {{limit_count}} ce mois.</p>
          <p>Pensez à upgrader vers Premium pour plus de capacité.</p>
        `,
      },
    };

    const template = templates[type];
    if (!template) {
      throw new Error(`Template de notification non trouvé: ${type}`);
    }

    return this.sendEmail({
      to,
      subject: this.personalizeContent(template.subject, data),
      html: this.personalizeContent(template.html, data),
      metadata: { notificationType: type },
    });
  }
}

module.exports = new EmailService();
