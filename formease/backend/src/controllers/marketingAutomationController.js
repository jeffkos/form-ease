const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger");
const emailService = require("../services/emailService");
const Joi = require("joi");

const prisma = new PrismaClient();

// Schémas de validation
const automationSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(500).optional(),
  trigger_type: Joi.string()
    .valid(
      "form_submission",
      "contact_created",
      "email_opened",
      "email_clicked",
      "time_based",
      "manual"
    )
    .required(),
  trigger_config: Joi.object({
    form_id: Joi.number().optional(),
    delay_minutes: Joi.number().min(0).optional(),
    conditions: Joi.array()
      .items(
        Joi.object({
          field: Joi.string().required(),
          operator: Joi.string()
            .valid(
              "equals",
              "contains",
              "not_equals",
              "greater_than",
              "less_than"
            )
            .required(),
          value: Joi.string().required(),
        })
      )
      .optional(),
  }).optional(),
  actions: Joi.array()
    .items(
      Joi.object({
        type: Joi.string()
          .valid(
            "send_email",
            "add_tag",
            "remove_tag",
            "update_contact",
            "wait",
            "webhook"
          )
          .required(),
        config: Joi.object().required(),
        delay_minutes: Joi.number().min(0).optional(),
      })
    )
    .min(1)
    .required(),
  is_active: Joi.boolean().default(true),
});

const workflowSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(500).optional(),
  steps: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().required(),
        type: Joi.string()
          .valid("trigger", "condition", "action", "delay")
          .required(),
        config: Joi.object().required(),
        next_steps: Joi.array().items(Joi.string()).optional(),
      })
    )
    .min(1)
    .required(),
  is_active: Joi.boolean().default(true),
});

// Créer une automation
exports.createAutomation = async (req, res) => {
  try {
    const { error, value } = automationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Données invalides",
        details: error.details.map((d) => d.message),
      });
    }

    const userId = req.user.id;
    const {
      name,
      description,
      trigger_type,
      trigger_config,
      actions,
      is_active,
    } = value;

    // Créer l'automation
    const automation = await prisma.marketingAutomation.create({
      data: {
        user_id: userId,
        name,
        description,
        trigger_type,
        trigger_config: trigger_config || {},
        actions,
        is_active,
        status: "active",
      },
    });

    logger.info("Marketing automation created", {
      automationId: automation.id,
      userId,
      triggerType: trigger_type,
    });

    res.status(201).json({
      message: "Automation créée avec succès",
      automation: {
        id: automation.id,
        name: automation.name,
        trigger_type: automation.trigger_type,
        is_active: automation.is_active,
        created_at: automation.created_at,
      },
    });
  } catch (error) {
    logger.error("Error creating marketing automation", {
      error: error.message,
      userId: req.user?.id,
    });
    res
      .status(500)
      .json({ error: "Erreur lors de la création de l'automation" });
  }
};

// Obtenir les automations de l'utilisateur
exports.getAutomations = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [automations, total] = await Promise.all([
      prisma.marketingAutomation.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          trigger_type: true,
          is_active: true,
          status: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: {
              executions: true,
            },
          },
        },
      }),
      prisma.marketingAutomation.count({ where: { user_id: userId } }),
    ]);

    res.json({
      automations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching automations", {
      error: error.message,
      userId: req.user?.id,
    });
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des automations" });
  }
};

// Obtenir les détails d'une automation
exports.getAutomationDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const automation = await prisma.marketingAutomation.findFirst({
      where: { id: parseInt(id), user_id: userId },
      include: {
        executions: {
          orderBy: { created_at: "desc" },
          take: 50,
          select: {
            id: true,
            contact_id: true,
            status: true,
            started_at: true,
            completed_at: true,
            error_message: true,
            metadata: true,
          },
        },
      },
    });

    if (!automation) {
      return res.status(404).json({ error: "Automation non trouvée" });
    }

    res.json(automation);
  } catch (error) {
    logger.error("Error fetching automation details", {
      error: error.message,
      userId: req.user?.id,
    });
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des détails" });
  }
};

// Mettre à jour une automation
exports.updateAutomation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { error, value } = automationSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: "Données invalides",
        details: error.details.map((d) => d.message),
      });
    }

    const automation = await prisma.marketingAutomation.findFirst({
      where: { id: parseInt(id), user_id: userId },
    });

    if (!automation) {
      return res.status(404).json({ error: "Automation non trouvée" });
    }

    const updatedAutomation = await prisma.marketingAutomation.update({
      where: { id: parseInt(id) },
      data: {
        ...value,
        updated_at: new Date(),
      },
    });

    logger.info("Marketing automation updated", {
      automationId: updatedAutomation.id,
      userId,
    });

    res.json({
      message: "Automation mise à jour avec succès",
      automation: updatedAutomation,
    });
  } catch (error) {
    logger.error("Error updating automation", {
      error: error.message,
      userId: req.user?.id,
    });
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
};

// Supprimer une automation
exports.deleteAutomation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const automation = await prisma.marketingAutomation.findFirst({
      where: { id: parseInt(id), user_id: userId },
    });

    if (!automation) {
      return res.status(404).json({ error: "Automation non trouvée" });
    }

    await prisma.marketingAutomation.delete({
      where: { id: parseInt(id) },
    });

    logger.info("Marketing automation deleted", {
      automationId: parseInt(id),
      userId,
    });

    res.json({ message: "Automation supprimée avec succès" });
  } catch (error) {
    logger.error("Error deleting automation", {
      error: error.message,
      userId: req.user?.id,
    });
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
};

// Activer/désactiver une automation
exports.toggleAutomation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { is_active } = req.body;

    const automation = await prisma.marketingAutomation.findFirst({
      where: { id: parseInt(id), user_id: userId },
    });

    if (!automation) {
      return res.status(404).json({ error: "Automation non trouvée" });
    }

    const updatedAutomation = await prisma.marketingAutomation.update({
      where: { id: parseInt(id) },
      data: {
        is_active: !!is_active,
        status: is_active ? "active" : "paused",
        updated_at: new Date(),
      },
    });

    logger.info("Marketing automation toggled", {
      automationId: parseInt(id),
      userId,
      isActive: !!is_active,
    });

    res.json({
      message: `Automation ${is_active ? "activée" : "désactivée"} avec succès`,
      automation: updatedAutomation,
    });
  } catch (error) {
    logger.error("Error toggling automation", {
      error: error.message,
      userId: req.user?.id,
    });
    res.status(500).json({ error: "Erreur lors du changement de statut" });
  }
};

// Déclencher manuellement une automation
exports.triggerAutomation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { contact_ids, test_mode = false } = req.body;

    const automation = await prisma.marketingAutomation.findFirst({
      where: { id: parseInt(id), user_id: userId },
    });

    if (!automation) {
      return res.status(404).json({ error: "Automation non trouvée" });
    }

    if (!automation.is_active) {
      return res.status(400).json({ error: "Automation désactivée" });
    }

    // Récupérer les contacts
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: contact_ids },
        // Optionnel: vérifier que les contacts appartiennent à l'utilisateur
      },
      select: { id: true, email: true, first_name: true, last_name: true },
    });

    if (contacts.length === 0) {
      return res.status(400).json({ error: "Aucun contact valide trouvé" });
    }

    // Exécuter l'automation pour chaque contact
    const executions = [];
    for (const contact of contacts) {
      const execution = await executeAutomation(automation, contact, test_mode);
      executions.push(execution);
    }

    logger.info("Manual automation trigger", {
      automationId: parseInt(id),
      userId,
      contactCount: contacts.length,
      testMode: test_mode,
    });

    res.json({
      message: "Automation déclenchée avec succès",
      executions: executions.length,
      results: executions,
    });
  } catch (error) {
    logger.error("Error triggering automation", {
      error: error.message,
      userId: req.user?.id,
    });
    res.status(500).json({ error: "Erreur lors du déclenchement" });
  }
};

// Obtenir les statistiques d'automation
exports.getAutomationStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = "30d" } = req.query;

    const dateFilter = getDateFilter(period);

    const [
      totalAutomations,
      activeAutomations,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      recentExecutions,
    ] = await Promise.all([
      prisma.marketingAutomation.count({ where: { user_id: userId } }),
      prisma.marketingAutomation.count({
        where: { user_id: userId, is_active: true },
      }),
      prisma.automationExecution.count({
        where: {
          automation: { user_id: userId },
          created_at: dateFilter,
        },
      }),
      prisma.automationExecution.count({
        where: {
          automation: { user_id: userId },
          status: "completed",
          created_at: dateFilter,
        },
      }),
      prisma.automationExecution.count({
        where: {
          automation: { user_id: userId },
          status: "failed",
          created_at: dateFilter,
        },
      }),
      prisma.automationExecution.findMany({
        where: {
          automation: { user_id: userId },
          created_at: dateFilter,
        },
        orderBy: { created_at: "desc" },
        take: 10,
        select: {
          id: true,
          status: true,
          created_at: true,
          automation: {
            select: { name: true },
          },
        },
      }),
    ]);

    const successRate =
      totalExecutions > 0
        ? ((successfulExecutions / totalExecutions) * 100).toFixed(1)
        : 0;

    res.json({
      overview: {
        totalAutomations,
        activeAutomations,
        totalExecutions,
        successRate: parseFloat(successRate),
      },
      performance: {
        successfulExecutions,
        failedExecutions,
        pendingExecutions:
          totalExecutions - successfulExecutions - failedExecutions,
      },
      recentExecutions,
    });
  } catch (error) {
    logger.error("Error fetching automation stats", {
      error: error.message,
      userId: req.user?.id,
    });
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des statistiques" });
  }
};

// Fonction helper pour exécuter une automation
async function executeAutomation(automation, contact, testMode = false) {
  try {
    // Créer l'enregistrement d'exécution
    const execution = await prisma.automationExecution.create({
      data: {
        automation_id: automation.id,
        contact_id: contact.id,
        status: "running",
        started_at: new Date(),
        metadata: { testMode },
      },
    });

    // Exécuter les actions
    const results = [];
    for (const action of automation.actions) {
      const actionResult = await executeAction(
        action,
        contact,
        automation,
        testMode
      );
      results.push(actionResult);

      // Attendre si delay configuré
      if (action.delay_minutes > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, action.delay_minutes * 60 * 1000)
        );
      }
    }

    // Marquer comme terminé
    await prisma.automationExecution.update({
      where: { id: execution.id },
      data: {
        status: "completed",
        completed_at: new Date(),
        results: results,
      },
    });

    return { success: true, executionId: execution.id, results };
  } catch (error) {
    // Marquer comme échoué
    await prisma.automationExecution.update({
      where: { id: execution.id },
      data: {
        status: "failed",
        error_message: error.message,
        completed_at: new Date(),
      },
    });

    logger.error("Automation execution failed", {
      automationId: automation.id,
      contactId: contact.id,
      error: error.message,
    });

    return { success: false, error: error.message };
  }
}

// Fonction helper pour exécuter une action
async function executeAction(action, contact, automation, testMode = false) {
  try {
    switch (action.type) {
      case "send_email":
        if (!testMode) {
          await emailService.sendEmail({
            to: contact.email,
            subject: action.config.subject || "Automation Email",
            html: action.config.content || "<p>Contenu automatique</p>",
            userId: automation.user_id,
            metadata: {
              automationId: automation.id,
              contactId: contact.id,
              actionType: "automation",
            },
          });
        }
        return { type: "send_email", success: true, testMode };

      case "add_tag":
        if (!testMode) {
          const currentTags = contact.tags || [];
          const newTags = [...new Set([...currentTags, action.config.tag])];
          await prisma.contact.update({
            where: { id: contact.id },
            data: { tags: newTags },
          });
        }
        return {
          type: "add_tag",
          success: true,
          tag: action.config.tag,
          testMode,
        };

      case "remove_tag":
        if (!testMode) {
          const currentTags = contact.tags || [];
          const newTags = currentTags.filter(
            (tag) => tag !== action.config.tag
          );
          await prisma.contact.update({
            where: { id: contact.id },
            data: { tags: newTags },
          });
        }
        return {
          type: "remove_tag",
          success: true,
          tag: action.config.tag,
          testMode,
        };

      case "update_contact":
        if (!testMode) {
          await prisma.contact.update({
            where: { id: contact.id },
            data: action.config.updates,
          });
        }
        return {
          type: "update_contact",
          success: true,
          updates: action.config.updates,
          testMode,
        };

      case "wait":
        if (!testMode) {
          await new Promise((resolve) =>
            setTimeout(resolve, action.config.minutes * 60 * 1000)
          );
        }
        return {
          type: "wait",
          success: true,
          minutes: action.config.minutes,
          testMode,
        };

      case "webhook":
        if (!testMode) {
          const fetch = require("node-fetch");
          await fetch(action.config.url, {
            method: action.config.method || "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contact,
              automation: { id: automation.id, name: automation.name },
              timestamp: new Date().toISOString(),
            }),
          });
        }
        return {
          type: "webhook",
          success: true,
          url: action.config.url,
          testMode,
        };

      default:
        throw new Error(`Type d'action non supporté: ${action.type}`);
    }
  } catch (error) {
    logger.error("Action execution failed", {
      actionType: action.type,
      contactId: contact.id,
      error: error.message,
    });
    return { type: action.type, success: false, error: error.message };
  }
}

// Fonction helper pour obtenir le filtre de date
function getDateFilter(period) {
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

module.exports = {
  createAutomation: exports.createAutomation,
  getAutomations: exports.getAutomations,
  getAutomationDetails: exports.getAutomationDetails,
  updateAutomation: exports.updateAutomation,
  deleteAutomation: exports.deleteAutomation,
  toggleAutomation: exports.toggleAutomation,
  triggerAutomation: exports.triggerAutomation,
  getAutomationStats: exports.getAutomationStats,
};
