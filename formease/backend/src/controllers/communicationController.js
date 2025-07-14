const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

const prisma = new PrismaClient();

// Configuration des services
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || "smtp.sendgrid.net",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Récupérer tous les participants avec leurs statuts de communication
 */
exports.getParticipants = async (req, res) => {
  try {
    const { formId, paymentStatus } = req.query;

    const whereClause = {
      userId: req.user.id,
    };

    if (formId) {
      whereClause.formId = formId;
    }

    if (paymentStatus) {
      whereClause.paymentStatus = paymentStatus;
    }

    const participants = await prisma.submission.findMany({
      where: whereClause,
      include: {
        form: {
          select: {
            title: true,
          },
        },
        communicationLogs: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Formater les données pour l'interface
    const formattedParticipants = participants.map((participant) => {
      const data = JSON.parse(participant.data);
      const lastCommunication = participant.communicationLogs[0];

      return {
        id: participant.id,
        name: data.name || data.nom || "Nom non fourni",
        email: data.email || "",
        phone: data.phone || data.telephone || "",
        formTitle: participant.form.title,
        paymentStatus: participant.paymentStatus,
        registrationDate: participant.createdAt,
        lastCommunication: lastCommunication
          ? {
              type: lastCommunication.type,
              date: lastCommunication.createdAt,
              status: lastCommunication.status,
            }
          : null,
        emailStatus:
          lastCommunication?.type === "email" ? lastCommunication.status : null,
        smsStatus:
          lastCommunication?.type === "sms" ? lastCommunication.status : null,
      };
    });

    res.json(formattedParticipants);
  } catch (error) {
    console.error("Erreur récupération participants:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * Créer une nouvelle campagne de communication
 */
exports.createCampaign = async (req, res) => {
  try {
    const {
      type,
      recipients,
      subject,
      content,
      scheduled,
      scheduledDate,
      newsletterName,
    } = req.body;

    // Créer la campagne
    const campaign = await prisma.communicationCampaign.create({
      data: {
        userId: req.user.id,
        name: subject || newsletterName || `Campagne ${type}`,
        type,
        status: scheduled ? "scheduled" : "sent",
        recipientCount: recipients.length,
        scheduledDate: scheduled ? new Date(scheduledDate) : null,
        subject,
        content,
        newsletterName,
      },
    });

    if (type === "newsletter") {
      // Ajouter les participants à la newsletter
      await handleNewsletterSubscription(
        recipients,
        newsletterName,
        req.user.id
      );
    } else if (!scheduled) {
      // Envoyer immédiatement
      await processCommunication(
        campaign.id,
        type,
        recipients,
        subject,
        content
      );
    }

    res.json({
      success: true,
      campaignId: campaign.id,
      message: scheduled
        ? "Campagne programmée avec succès"
        : "Campagne envoyée avec succès",
    });
  } catch (error) {
    console.error("Erreur création campagne:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la création de la campagne" });
  }
};

/**
 * Traiter l'envoi d'une communication
 */
async function processCommunication(
  campaignId,
  type,
  recipients,
  subject,
  content
) {
  let sentCount = 0;
  let deliveredCount = 0;
  let failedCount = 0;

  for (const recipientId of recipients) {
    try {
      // Récupérer les données du participant
      const participant = await prisma.submission.findUnique({
        where: { id: recipientId },
      });

      if (!participant) continue;

      const data = JSON.parse(participant.data);
      const name = data.name || data.nom || "Participant";
      const email = data.email;
      const phone = data.phone || data.telephone;

      // Personnaliser le contenu
      const personalizedContent = content
        .replace(/{{nom}}/g, name)
        .replace(/{{name}}/g, name)
        .replace(/{{email}}/g, email);

      let deliveryStatus = "failed";
      let trackingId = null;

      if (type === "email" && email) {
        const result = await sendEmail(
          email,
          subject,
          personalizedContent,
          campaignId,
          recipientId
        );
        deliveryStatus = result.status;
        trackingId = result.trackingId;
      } else if (type === "sms" && phone) {
        const result = await sendSMS(
          phone,
          personalizedContent,
          campaignId,
          recipientId
        );
        deliveryStatus = result.status;
        trackingId = result.trackingId;
      }

      // Enregistrer le log de communication
      await prisma.communicationLog.create({
        data: {
          campaignId,
          submissionId: recipientId,
          type,
          status: deliveryStatus,
          trackingId,
          subject,
          content: personalizedContent,
          recipientEmail: email,
          recipientPhone: phone,
        },
      });

      if (deliveryStatus === "sent" || deliveryStatus === "delivered") {
        sentCount++;
        if (deliveryStatus === "delivered") {
          deliveredCount++;
        }
      } else {
        failedCount++;
      }
    } catch (error) {
      console.error(`Erreur envoi à ${recipientId}:`, error);
      failedCount++;
    }
  }

  // Mettre à jour les statistiques de la campagne
  await prisma.communicationCampaign.update({
    where: { id: campaignId },
    data: {
      sentCount,
      deliveredCount,
      failedCount,
      status: "completed",
    },
  });
}

/**
 * Envoyer un email avec tracking
 */
async function sendEmail(email, subject, content, campaignId, recipientId) {
  try {
    const trackingId = `${campaignId}_${recipientId}_${Date.now()}`;

    // Ajouter les pixels de tracking
    const trackingPixel = `<img src="${process.env.BASE_URL}/api/tracking/email/open/${trackingId}" width="1" height="1" style="display:none;" />`;
    const trackedContent = content + trackingPixel;

    // Ajouter le tracking des liens
    const trackedContentWithLinks = trackedContent.replace(
      /<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi,
      `<a href="${process.env.BASE_URL}/api/tracking/email/click/${trackingId}?url=$1"$2>`
    );

    const mailOptions = {
      from: process.env.FROM_EMAIL || "noreply@formease.com",
      to: email,
      subject,
      html: trackedContentWithLinks,
      headers: {
        "X-Campaign-ID": campaignId,
        "X-Tracking-ID": trackingId,
      },
    };

    await emailTransporter.sendMail(mailOptions);

    return {
      status: "sent",
      trackingId,
    };
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return {
      status: "failed",
      trackingId: null,
    };
  }
}

/**
 * Envoyer un SMS
 */
async function sendSMS(phone, content, campaignId, recipientId) {
  try {
    const trackingId = `${campaignId}_${recipientId}_${Date.now()}`;

    // Nettoyer le numéro de téléphone
    const cleanPhone = phone.replace(/[^\d+]/g, "");

    const message = await twilioClient.messages.create({
      body: content,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: cleanPhone,
    });

    return {
      status: "sent",
      trackingId,
      messageId: message.sid,
    };
  } catch (error) {
    console.error("Erreur envoi SMS:", error);
    return {
      status: "failed",
      trackingId: null,
    };
  }
}

/**
 * Gérer l'abonnement à la newsletter
 */
async function handleNewsletterSubscription(
  recipients,
  newsletterName,
  userId
) {
  for (const recipientId of recipients) {
    try {
      const participant = await prisma.submission.findUnique({
        where: { id: recipientId },
      });

      if (!participant) continue;

      const data = JSON.parse(participant.data);

      // Créer ou mettre à jour l'abonnement newsletter
      await prisma.newsletterSubscription.upsert({
        where: {
          email_newsletterName: {
            email: data.email,
            newsletterName,
          },
        },
        update: {
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          userId,
          email: data.email,
          name: data.name || data.nom || "Participant",
          newsletterName,
          isActive: true,
          submissionId: recipientId,
        },
      });
    } catch (error) {
      console.error(`Erreur abonnement newsletter ${recipientId}:`, error);
    }
  }
}

/**
 * Récupérer les campagnes
 */
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await prisma.communicationCampaign.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(campaigns);
  } catch (error) {
    console.error("Erreur récupération campagnes:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * Tracking d'ouverture d'email
 */
exports.trackEmailOpen = async (req, res) => {
  try {
    const { trackingId } = req.params;

    // Mettre à jour le statut
    await prisma.communicationLog.updateMany({
      where: { trackingId },
      data: {
        status: "opened",
        openedAt: new Date(),
      },
    });

    // Incrémenter le compteur de la campagne
    const log = await prisma.communicationLog.findFirst({
      where: { trackingId },
    });

    if (log) {
      await prisma.communicationCampaign.update({
        where: { id: log.campaignId },
        data: {
          openedCount: {
            increment: 1,
          },
        },
      });
    }

    // Retourner un pixel transparent
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    res.set("Content-Type", "image/gif");
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.send(pixel);
  } catch (error) {
    console.error("Erreur tracking ouverture:", error);
    res.status(500).send("Error");
  }
};

/**
 * Tracking de clic d'email
 */
exports.trackEmailClick = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { url } = req.query;

    // Mettre à jour le statut
    await prisma.communicationLog.updateMany({
      where: { trackingId },
      data: {
        status: "clicked",
        clickedAt: new Date(),
      },
    });

    // Incrémenter le compteur de la campagne
    const log = await prisma.communicationLog.findFirst({
      where: { trackingId },
    });

    if (log) {
      await prisma.communicationCampaign.update({
        where: { id: log.campaignId },
        data: {
          clickedCount: {
            increment: 1,
          },
        },
      });
    }

    // Rediriger vers l'URL originale
    res.redirect(url || "https://formease.com");
  } catch (error) {
    console.error("Erreur tracking clic:", error);
    res.redirect("https://formease.com");
  }
};

/**
 * Obtenir les statistiques détaillées d'une campagne
 */
exports.getCampaignStats = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await prisma.communicationCampaign.findUnique({
      where: { id: campaignId },
      include: {
        logs: {
          include: {
            submission: true,
          },
        },
      },
    });

    if (!campaign || campaign.userId !== req.user.id) {
      return res.status(404).json({ error: "Campagne non trouvée" });
    }

    // Calculer les statistiques détaillées
    const stats = {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        createdAt: campaign.createdAt,
        scheduledDate: campaign.scheduledDate,
      },
      metrics: {
        total: campaign.recipientCount,
        sent: campaign.sentCount,
        delivered: campaign.deliveredCount,
        opened: campaign.openedCount,
        clicked: campaign.clickedCount,
        failed: campaign.failedCount,
      },
      rates: {
        deliveryRate:
          campaign.sentCount > 0
            ? (campaign.deliveredCount / campaign.sentCount) * 100
            : 0,
        openRate:
          campaign.deliveredCount > 0
            ? (campaign.openedCount / campaign.deliveredCount) * 100
            : 0,
        clickRate:
          campaign.openedCount > 0
            ? (campaign.clickedCount / campaign.openedCount) * 100
            : 0,
      },
      recipients: campaign.logs.map((log) => {
        const data = JSON.parse(log.submission.data);
        return {
          id: log.id,
          name: data.name || data.nom || "Participant",
          email: log.recipientEmail,
          phone: log.recipientPhone,
          status: log.status,
          sentAt: log.createdAt,
          openedAt: log.openedAt,
          clickedAt: log.clickedAt,
        };
      }),
    };

    res.json(stats);
  } catch (error) {
    console.error("Erreur récupération statistiques:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * Renvoyer une communication échouée
 */
exports.retryCommunication = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { recipients } = req.body;

    const campaign = await prisma.communicationCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign || campaign.userId !== req.user.id) {
      return res.status(404).json({ error: "Campagne non trouvée" });
    }

    // Renvoyer aux destinataires sélectionnés
    await processCommunication(
      campaignId,
      campaign.type,
      recipients,
      campaign.subject,
      campaign.content
    );

    res.json({ success: true, message: "Communication renvoyée avec succès" });
  } catch (error) {
    console.error("Erreur renvoi communication:", error);
    res.status(500).json({ error: "Erreur lors du renvoi" });
  }
};

/**
 * Gérer les webhooks Twilio pour le statut des SMS
 */
exports.handleTwilioWebhook = async (req, res) => {
  try {
    const { MessageSid, MessageStatus } = req.body;

    // Mettre à jour le statut du SMS
    await prisma.communicationLog.updateMany({
      where: {
        trackingId: { contains: MessageSid },
      },
      data: {
        status:
          MessageStatus === "delivered"
            ? "delivered"
            : MessageStatus === "failed"
            ? "failed"
            : "sent",
        deliveredAt: MessageStatus === "delivered" ? new Date() : null,
      },
    });

    res.status(200).send("OK");
  } catch (error) {
    console.error("Erreur webhook Twilio:", error);
    res.status(500).send("Error");
  }
};
