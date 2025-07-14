// Contrôleur de gestion des tickets de support pour FormEase
const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger");
const nodemailer = require("nodemailer");

const prisma = new PrismaClient();

// Configuration SMTP pour les notifications
const smtpTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp1.o2switch.net",
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Créer un nouveau ticket
const createTicket = async (req, res) => {
  try {
    const {
      subject,
      description,
      priority = "medium",
      category = "general",
    } = req.body;
    const userId = req.user.id;

    // Validation des champs requis
    if (!subject || !description) {
      return res.status(400).json({
        message: "Le sujet et la description sont requis",
        error: "MISSING_REQUIRED_FIELDS",
      });
    }

    // Créer le ticket
    const ticket = await prisma.ticket.create({
      data: {
        subject,
        description,
        priority,
        category,
        status: "open",
        user_id: userId,
      },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            plan: true,
          },
        },
      },
    });

    // Envoyer une notification email à l'équipe support
    try {
      await smtpTransport.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.SUPPORT_EMAIL || "support@formease.com",
        subject: `[FormEase Support] Nouveau ticket #${ticket.id} - ${subject}`,
        html: `
          <h2>Nouveau ticket de support</h2>
          <p><strong>Ticket ID:</strong> #${ticket.id}</p>
          <p><strong>Utilisateur:</strong> ${ticket.user.first_name} ${
          ticket.user.last_name
        } (${ticket.user.email})</p>
          <p><strong>Plan:</strong> ${ticket.user.plan.toUpperCase()}</p>
          <p><strong>Sujet:</strong> ${subject}</p>
          <p><strong>Priorité:</strong> ${priority}</p>
          <p><strong>Catégorie:</strong> ${category}</p>
          <p><strong>Description:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
            ${description.replace(/\n/g, "<br>")}
          </div>
          <p><a href="${
            process.env.FRONTEND_URL
          }/admin#tickets">Voir le ticket</a></p>
        `,
      });
    } catch (emailError) {
      logger.warn("Failed to send ticket notification email:", emailError);
    }

    // Log de l'action
    logger.info(`Ticket created: ${ticket.id}`, {
      userId,
      ticketId: ticket.id,
      subject,
      priority,
      category,
    });

    res.status(201).json({
      success: true,
      message: "Ticket créé avec succès",
      data: ticket,
    });
  } catch (error) {
    logger.error("Error creating ticket:", error);
    res.status(500).json({
      message: "Erreur lors de la création du ticket",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

// Récupérer les tickets d'un utilisateur
exports.getUserTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || "";

    const skip = (page - 1) * limit;

    const where = { user_id: userId };
    if (status) where.status = status;

    const [tickets, totalCount] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          _count: {
            select: { comments: true },
          },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching user tickets:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des tickets",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

// Récupérer un ticket spécifique avec ses commentaires
exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === "SUPERADMIN";

    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            plan: true,
          },
        },
        comments: {
          orderBy: { created_at: "asc" },
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket non trouvé",
        error: "TICKET_NOT_FOUND",
      });
    }

    // Vérifier les permissions
    if (!isAdmin && ticket.user_id !== userId) {
      return res.status(403).json({
        message: "Accès refusé à ce ticket",
        error: "ACCESS_DENIED",
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    logger.error("Error fetching ticket:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération du ticket",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

// Ajouter un commentaire à un ticket
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === "SUPERADMIN";

    if (!content) {
      return res.status(400).json({
        message: "Le contenu du commentaire est requis",
        error: "MISSING_CONTENT",
      });
    }

    // Vérifier que le ticket existe et l'utilisateur a accès
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket non trouvé",
        error: "TICKET_NOT_FOUND",
      });
    }

    if (!isAdmin && ticket.user_id !== userId) {
      return res.status(403).json({
        message: "Accès refusé à ce ticket",
        error: "ACCESS_DENIED",
      });
    }

    // Créer le commentaire
    const comment = await prisma.ticketComment.create({
      data: {
        content,
        ticket_id: parseInt(id),
        user_id: userId,
        is_admin: isAdmin,
      },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Mettre à jour le statut du ticket si c'est un admin qui répond
    if (isAdmin && ticket.status === "open") {
      await prisma.ticket.update({
        where: { id: parseInt(id) },
        data: { status: "in_progress" },
      });
    }

    // Envoyer une notification email
    try {
      const recipient = isAdmin
        ? ticket.user.email
        : process.env.SUPPORT_EMAIL || "support@formease.com";
      const subject = `[FormEase Support] Nouveau commentaire sur le ticket #${id}`;

      await smtpTransport.sendMail({
        from: process.env.SMTP_USER,
        to: recipient,
        subject,
        html: `
          <h2>Nouveau commentaire sur votre ticket</h2>
          <p><strong>Ticket ID:</strong> #${id}</p>
          <p><strong>Sujet:</strong> ${ticket.subject}</p>
          <p><strong>Commentaire de:</strong> ${comment.user.first_name} ${
          comment.user.last_name
        } ${isAdmin ? "(Support)" : ""}</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            ${content.replace(/\n/g, "<br>")}
          </div>
          <p><a href="${process.env.FRONTEND_URL}/${
          isAdmin ? "admin#tickets" : "dashboard/support"
        }">Voir le ticket</a></p>
        `,
      });
    } catch (emailError) {
      logger.warn("Failed to send comment notification email:", emailError);
    }

    res.status(201).json({
      success: true,
      message: "Commentaire ajouté avec succès",
      data: comment,
    });
  } catch (error) {
    logger.error("Error adding comment:", error);
    res.status(500).json({
      message: "Erreur lors de l'ajout du commentaire",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

// Mettre à jour le statut d'un ticket (ADMIN uniquement)
exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;

    if (!["open", "in_progress", "resolved", "closed"].includes(status)) {
      return res.status(400).json({
        message: "Statut invalide",
        error: "INVALID_STATUS",
      });
    }

    const updateData = { status };
    if (resolution) updateData.resolution = resolution;
    if (status === "resolved" || status === "closed") {
      updateData.resolved_at = new Date();
    }

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    // Envoyer une notification à l'utilisateur
    try {
      await smtpTransport.sendMail({
        from: process.env.SMTP_USER,
        to: ticket.user.email,
        subject: `[FormEase Support] Ticket #${id} - Statut mis à jour`,
        html: `
          <h2>Mise à jour de votre ticket</h2>
          <p><strong>Ticket ID:</strong> #${id}</p>
          <p><strong>Sujet:</strong> ${ticket.subject}</p>
          <p><strong>Nouveau statut:</strong> ${status.toUpperCase()}</p>
          ${
            resolution
              ? `<p><strong>Résolution:</strong></p><div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${resolution.replace(
                  /\n/g,
                  "<br>"
                )}</div>`
              : ""
          }
          <p><a href="${
            process.env.FRONTEND_URL
          }/dashboard/support">Voir le ticket</a></p>
        `,
      });
    } catch (emailError) {
      logger.warn("Failed to send status update email:", emailError);
    }

    logger.info(`Ticket ${id} status updated to ${status}`, {
      adminId: req.user.id,
      ticketId: parseInt(id),
      newStatus: status,
    });

    res.json({
      success: true,
      message: "Statut du ticket mis à jour avec succès",
      data: ticket,
    });
  } catch (error) {
    logger.error("Error updating ticket status:", error);
    res.status(500).json({
      message: "Erreur lors de la mise à jour du statut",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

// Récupérer tous les tickets (ADMIN uniquement)
exports.getAllTickets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || "";
    const priority = req.query.priority || "";
    const category = req.query.category || "";

    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    const [tickets, totalCount] = await Promise.all([
      prisma.ticket.findMany({
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
              plan: true,
            },
          },
          _count: {
            select: { comments: true },
          },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching all tickets:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des tickets",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

// Statistiques des tickets (ADMIN uniquement)
exports.getTicketStats = async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );

    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      ticketsThisMonth,
      averageResolutionTime,
    ] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: "open" } }),
      prisma.ticket.count({ where: { status: "in_progress" } }),
      prisma.ticket.count({ where: { status: "resolved" } }),
      prisma.ticket.count({ where: { status: "closed" } }),
      prisma.ticket.count({ where: { created_at: { gte: lastMonth } } }),
      prisma.ticket.aggregate({
        _avg: {
          resolved_at: true,
        },
        where: {
          resolved_at: { not: null },
        },
      }),
    ]);

    // Tickets par priorité
    const ticketsByPriority = await prisma.ticket.groupBy({
      by: ["priority"],
      _count: true,
    });

    // Tickets par catégorie
    const ticketsByCategory = await prisma.ticket.groupBy({
      by: ["category"],
      _count: true,
    });

    res.json({
      success: true,
      data: {
        overview: {
          total: totalTickets,
          open: openTickets,
          inProgress: inProgressTickets,
          resolved: resolvedTickets,
          closed: closedTickets,
          thisMonth: ticketsThisMonth,
        },
        distribution: {
          byPriority: ticketsByPriority,
          byCategory: ticketsByCategory,
        },
        performance: {
          averageResolutionTime: averageResolutionTime._avg?.resolved_at || 0,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching ticket stats:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des statistiques",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

module.exports = {
  createTicket,
  getUserTickets: exports.getUserTickets,
  getTicketById: exports.getTicketById,
  addComment: exports.addComment,
  updateTicketStatus: exports.updateTicketStatus,
  getAllTickets: exports.getAllTickets,
  getTicketStats: exports.getTicketStats,
};
