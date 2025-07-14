// Routes de gestion des tickets de support pour FormEase
const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const { default: auth } = require("../middleware/auth");
const { requireSuperAdmin } = require("../controllers/adminController");

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Système de tickets de support
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Ticket:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         subject:
 *           type: string
 *         description:
 *           type: string
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         category:
 *           type: string
 *           enum: [general, technical, billing, feature]
 *         status:
 *           type: string
 *           enum: [open, in_progress, resolved, closed]
 *         resolution:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         resolved_at:
 *           type: string
 *           format: date-time
 *         user:
 *           type: object
 *           properties:
 *             first_name:
 *               type: string
 *             last_name:
 *               type: string
 *             email:
 *               type: string
 *             plan:
 *               type: string
 *     TicketComment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         content:
 *           type: string
 *         is_admin:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         user:
 *           type: object
 *           properties:
 *             first_name:
 *               type: string
 *             last_name:
 *               type: string
 *             email:
 *               type: string
 *             role:
 *               type: string
 */

// Toutes les routes nécessitent une authentification
router.use(auth);

/**
 * @swagger
 * /api/tickets:
 *   post:
 *     summary: Créer un nouveau ticket de support
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - description
 *             properties:
 *               subject:
 *                 type: string
 *                 description: Sujet du ticket
 *               description:
 *                 type: string
 *                 description: Description détaillée du problème
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *                 description: Priorité du ticket
 *               category:
 *                 type: string
 *                 enum: [general, technical, billing, feature]
 *                 default: general
 *                 description: Catégorie du ticket
 *     responses:
 *       201:
 *         description: Ticket créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Données manquantes ou invalides
 *       401:
 *         description: Non authentifié
 *   get:
 *     summary: Récupérer les tickets de l'utilisateur connecté
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre de tickets par page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, resolved, closed]
 *         description: Filtrer par statut
 *     responses:
 *       200:
 *         description: Liste des tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tickets:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Ticket'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 */
router.post("/", ticketController.createTicket);
router.get("/", ticketController.getUserTickets);

/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     summary: Récupérer un ticket spécifique avec ses commentaires
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du ticket
 *     responses:
 *       200:
 *         description: Détails du ticket
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Ticket'
 *                     - type: object
 *                       properties:
 *                         comments:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/TicketComment'
 *       404:
 *         description: Ticket non trouvé
 *       403:
 *         description: Accès refusé
 */
router.get("/:id", ticketController.getTicketById);

/**
 * @swagger
 * /api/tickets/{id}/comments:
 *   post:
 *     summary: Ajouter un commentaire à un ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Contenu du commentaire
 *     responses:
 *       201:
 *         description: Commentaire ajouté avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/TicketComment'
 *       400:
 *         description: Contenu manquant
 *       404:
 *         description: Ticket non trouvé
 *       403:
 *         description: Accès refusé
 */
router.post("/:id/comments", ticketController.addComment);

// Routes administrateur uniquement
/**
 * @swagger
 * /api/tickets/admin/all:
 *   get:
 *     summary: Récupérer tous les tickets (ADMIN uniquement)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre de tickets par page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, resolved, closed]
 *         description: Filtrer par statut
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filtrer par priorité
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [general, technical, billing, feature]
 *         description: Filtrer par catégorie
 *     responses:
 *       200:
 *         description: Liste de tous les tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tickets:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Ticket'
 *                     pagination:
 *                       type: object
 *       403:
 *         description: Accès refusé - SUPERADMIN requis
 */
router.get("/admin/all", requireSuperAdmin, ticketController.getAllTickets);

/**
 * @swagger
 * /api/tickets/admin/stats:
 *   get:
 *     summary: Statistiques des tickets (ADMIN uniquement)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques des tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         open:
 *                           type: integer
 *                         inProgress:
 *                           type: integer
 *                         resolved:
 *                           type: integer
 *                         closed:
 *                           type: integer
 *                         thisMonth:
 *                           type: integer
 *                     distribution:
 *                       type: object
 *                       properties:
 *                         byPriority:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               priority:
 *                                 type: string
 *                               _count:
 *                                 type: integer
 *                         byCategory:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               category:
 *                                 type: string
 *                               _count:
 *                                 type: integer
 *                     performance:
 *                       type: object
 *                       properties:
 *                         averageResolutionTime:
 *                           type: number
 *       403:
 *         description: Accès refusé - SUPERADMIN requis
 */
router.get("/admin/stats", requireSuperAdmin, ticketController.getTicketStats);

/**
 * @swagger
 * /api/tickets/{id}/status:
 *   put:
 *     summary: Mettre à jour le statut d'un ticket (ADMIN uniquement)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, resolved, closed]
 *                 description: Nouveau statut du ticket
 *               resolution:
 *                 type: string
 *                 description: Résolution du ticket (optionnel)
 *     responses:
 *       200:
 *         description: Statut mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Statut invalide
 *       404:
 *         description: Ticket non trouvé
 *       403:
 *         description: Accès refusé - SUPERADMIN requis
 */
router.put(
  "/:id/status",
  requireSuperAdmin,
  ticketController.updateTicketStatus
);

module.exports = router;
