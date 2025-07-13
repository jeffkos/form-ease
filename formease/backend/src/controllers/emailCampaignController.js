const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger");
const emailService = require("../services/emailService");
const Joi = require("joi");

const prisma = new PrismaClient();

// Schémas de validation
const campaignSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  subject: Joi.string().min(1).max(200).required(),
  content: Joi.string().min(1).required(),
  recipient_type: Joi.string().valid("all", "filtered", "selected").required(),
  filters: Joi.object({
    country: Joi.string().optional(),
    city: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    date_range: Joi.object({
      start: Joi.date().optional(),
      end: Joi.date().optional(),
    }).optional(),
  }).optional(),
  selected_contacts: Joi.array().items(Joi.number()).optional(),
  schedule_date: Joi.date().optional(),
  template_id: Joi.number().optional(),
});

const bulkEmailSchema = Joi.object({
  subject: Joi.string().min(1).max(200).required(),
  content: Joi.string().min(1).required(),
  contacts: Joi.array().items(Joi.number()).min(1).required(),
  schedule_date: Joi.date().optional(),
});

// Créer une campagne d'emailing
exports.createCampaign = async (req, res) => {
  try {
    const { error, value } = campaignSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Données invalides",
        details: error.details.map((d) => d.message),
      });
    }

    const userId = req.user.id;
    const {
      name,
      subject,
      content,
      recipient_type,
      filters,
      selected_contacts,
      schedule_date,
      template_id,
    } = value;

    // Vérifier les quotas d'emails
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const monthlyLimit = user.plan === "premium" ? 5000 : 50;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const emailsSentThisMonth = await prisma.emailLog.count({
      where: {
        user_id: userId,
        sent_at: { gte: startOfMonth },
      },
    });

    // Calculer le nombre de destinataires
    let recipientCount = 0;
    let contacts = [];

    if (recipient_type === "all") {
      recipientCount = await prisma.contact.count();
      contacts = await prisma.contact.findMany({
        select: { id: true, email: true, first_name: true, last_name: true },
      });
    } else if (recipient_type === "filtered") {
      const where = {};
      if (filters?.country) where.country = filters.country;
      if (filters?.city) where.city = filters.city;
      if (filters?.tags) {
        where.tags = { hasSome: filters.tags };
      }
      if (filters?.date_range) {
        where.created_at = {};
        if (filters.date_range.start)
          where.created_at.gte = filters.date_range.start;
        if (filters.date_range.end)
          where.created_at.lte = filters.date_range.end;
      }

      recipientCount = await prisma.contact.count({ where });
      contacts = await prisma.contact.findMany({
        where,
        select: { id: true, email: true, first_name: true, last_name: true },
      });
    } else if (recipient_type === "selected") {
      recipientCount = selected_contacts.length;
      contacts = await prisma.contact.findMany({
        where: { id: { in: selected_contacts } },
        select: { id: true, email: true, first_name: true, last_name: true },
      });
    }

    // Vérifier si l'envoi ne dépasse pas les quotas
    if (emailsSentThisMonth + recipientCount > monthlyLimit) {
      return res.status(403).json({
        error: "Quota d'emails dépassé",
        current: emailsSentThisMonth,
        limit: monthlyLimit,
        requested: recipientCount,
      });
    }

    // Créer la campagne
    const campaign = await prisma.emailCampaign.create({
      data: {
        user_id: userId,
        name,
        subject,
        content,
        recipient_type,
        filters: filters || {},
        selected_contacts: selected_contacts || [],
        recipient_count: recipientCount,
        status: schedule_date ? "scheduled" : "draft",
        scheduled_at: schedule_date,
        template_id,
      },
    });

    // Si pas de programmation, envoyer immédiatement
    if (!schedule_date) {
      await sendCampaignEmails(campaign, contacts);
    }

    logger.info("Email campaign created", {
      campaignId: campaign.id,
      userId,
      recipientCount,
      scheduled: !!schedule_date,
    });

    res.status(201).json({
      message: "Campagne créée avec succès",
      campaign: {
        id: campaign.id,
        name: campaign.name,
        recipient_count: recipientCount,
        status: campaign.status,
        scheduled_at: campaign.scheduled_at,
      },
    });
  } catch (error) {
    logger.error("Error creating email campaign", {
      error: error.message,
      userId: req.user?.id,
    });
    res
      .status(500)
      .json({ error: "Erreur lors de la création de la campagne" });
  }
};

// Envoi groupé d'emails (version simplifiée)
exports.sendBulkEmail = async (req, res) => {
  try {
    const { error, value } = bulkEmailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Données invalides",
        details: error.details.map((d) => d.message),
      });
    }

    const userId = req.user.id;
    const { subject, content, contacts: contactIds, schedule_date } = value;

    // Vérifier les quotas
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const monthlyLimit = user.plan === "premium" ? 5000 : 50;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const emailsSentThisMonth = await prisma.emailLog.count({
      where: {
        user_id: userId,
        sent_at: { gte: startOfMonth },
      },
    });

    if (emailsSentThisMonth + contactIds.length > monthlyLimit) {
      return res.status(403).json({
        error: "Quota d'emails dépassé",
        current: emailsSentThisMonth,
        limit: monthlyLimit,
        requested: contactIds.length,
      });
    }

    // Récupérer les contacts
    const contacts = await prisma.contact.findMany({
      where: { id: { in: contactIds } },
      select: { id: true, email: true, first_name: true, last_name: true },
    });

    if (contacts.length === 0) {
      return res.status(400).json({ error: "Aucun contact valide trouvé" });
    }

    // Créer une campagne temporaire pour le tracking
    const campaign = await prisma.emailCampaign.create({
      data: {
        user_id: userId,
        name: `Envoi groupé - ${new Date().toLocaleDateString()}`,
        subject,
        content,
        recipient_type: "selected",
        selected_contacts: contactIds,
        recipient_count: contacts.length,
        status: schedule_date ? "scheduled" : "sending",
        scheduled_at: schedule_date,
      },
    });

    // Envoyer les emails si pas de programmation
    if (!schedule_date) {
      await sendCampaignEmails(campaign, contacts);
    }

    logger.info("Bulk email sent", {
      campaignId: campaign.id,
      userId,
      recipientCount: contacts.length,
    });

    res.json({
      message: "Emails envoyés avec succès",
      campaign_id: campaign.id,
      sent_count: contacts.length,
      scheduled: !!schedule_date,
    });
  } catch (error) {
    logger.error("Error sending bulk email", {
      error: error.message,
      userId: req.user?.id,
    });
    res.status(500).json({ error: "Erreur lors de l'envoi des emails" });
  }
};

// Obtenir les campagnes de l'utilisateur
exports.getCampaigns = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          subject: true,
          recipient_count: true,
          status: true,
          sent_count: true,
          opened_count: true,
          clicked_count: true,
          created_at: true,
          scheduled_at: true,
          sent_at: true,
        },
      }),
      prisma.emailCampaign.count({ where: { user_id: userId } }),
    ]);

    res.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching campaigns", {
      error: error.message,
      userId: req.user?.id,
    });
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des campagnes" });
  }
};

// Obtenir les détails d'une campagne
exports.getCampaignDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const campaign = await prisma.emailCampaign.findFirst({
      where: { id: parseInt(id), user_id: userId },
      include: {
        emailLogs: {
          orderBy: { sent_at: "desc" },
          take: 100,
          select: {
            id: true,
            recipient_email: true,
            status: true,
            sent_at: true,
            opened_at: true,
            clicked_at: true,
            error_message: true,
          },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campagne non trouvée" });
    }

    res.json(campaign);
  } catch (error) {
    logger.error("Error fetching campaign details", {
      error: error.message,
      userId: req.user?.id,
    });
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des détails" });
  }
};

// Obtenir les statistiques d'emailing
exports.getEmailStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalCampaigns,
      totalEmailsSent,
      emailsThisMonth,
      totalOpened,
      totalClicked,
      recentCampaigns,
    ] = await Promise.all([
      prisma.emailCampaign.count({ where: { user_id: userId } }),
      prisma.emailLog.count({ where: { user_id: userId } }),
      prisma.emailLog.count({
        where: {
          user_id: userId,
          sent_at: { gte: startOfMonth },
        },
      }),
      prisma.emailLog.count({
        where: {
          user_id: userId,
          opened_at: { not: null },
        },
      }),
      prisma.emailLog.count({
        where: {
          user_id: userId,
          clicked_at: { not: null },
        },
      }),
      prisma.emailCampaign.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          status: true,
          sent_count: true,
          opened_count: true,
          created_at: true,
        },
      }),
    ]);

    // Calculer les taux
    const openRate =
      totalEmailsSent > 0
        ? ((totalOpened / totalEmailsSent) * 100).toFixed(1)
        : 0;
    const clickRate =
      totalEmailsSent > 0
        ? ((totalClicked / totalEmailsSent) * 100).toFixed(1)
        : 0;

    // Quota utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    const monthlyLimit = user.plan === "premium" ? 5000 : 50;

    res.json({
      overview: {
        totalCampaigns,
        totalEmailsSent,
        emailsThisMonth,
        monthlyLimit,
        quotaUsed: ((emailsThisMonth / monthlyLimit) * 100).toFixed(1),
      },
      performance: {
        openRate: parseFloat(openRate),
        clickRate: parseFloat(clickRate),
        totalOpened,
        totalClicked,
      },
      recentCampaigns,
    });
  } catch (error) {
    logger.error("Error fetching email stats", {
      error: error.message,
      userId: req.user?.id,
    });
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des statistiques" });
  }
};

// Fonction helper pour envoyer les emails d'une campagne
async function sendCampaignEmails(campaign, contacts) {
  try {
    const emailPromises = contacts.map(async (contact) => {
      try {
        // Personnaliser le contenu
        const personalizedContent = campaign.content
          .replace("{{first_name}}", contact.first_name || "")
          .replace("{{last_name}}", contact.last_name || "")
          .replace("{{email}}", contact.email);

        // Envoyer l'email via le service
        await emailService.sendEmail({
          to: contact.email,
          subject: campaign.subject,
          html: personalizedContent,
          campaignId: campaign.id,
        });

        // Logger l'envoi
        await prisma.emailLog.create({
          data: {
            user_id: campaign.user_id,
            campaign_id: campaign.id,
            recipient_email: contact.email,
            subject: campaign.subject,
            status: "sent",
            sent_at: new Date(),
          },
        });

        return { success: true, email: contact.email };
      } catch (error) {
        // Logger l'erreur
        await prisma.emailLog.create({
          data: {
            user_id: campaign.user_id,
            campaign_id: campaign.id,
            recipient_email: contact.email,
            subject: campaign.subject,
            status: "failed",
            error_message: error.message,
            sent_at: new Date(),
          },
        });

        logger.error("Failed to send email", {
          campaignId: campaign.id,
          email: contact.email,
          error: error.message,
        });

        return { success: false, email: contact.email, error: error.message };
      }
    });

    // Attendre tous les envois
    const results = await Promise.all(emailPromises);
    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    // Mettre à jour la campagne
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "sent",
        sent_at: new Date(),
        sent_count: successCount,
        failed_count: failedCount,
      },
    });

    logger.info("Campaign emails sent", {
      campaignId: campaign.id,
      total: contacts.length,
      success: successCount,
      failed: failedCount,
    });

    return { success: successCount, failed: failedCount };
  } catch (error) {
    logger.error("Error in sendCampaignEmails", {
      campaignId: campaign.id,
      error: error.message,
    });
    throw error;
  }
}

module.exports = {
  createCampaign: exports.createCampaign,
  sendBulkEmail: exports.sendBulkEmail,
  getCampaigns: exports.getCampaigns,
  getCampaignDetails: exports.getCampaignDetails,
  getEmailStats: exports.getEmailStats,
};
