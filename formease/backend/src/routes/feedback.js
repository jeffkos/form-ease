const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');
const Joi = require('joi');

// Validation schemas
const feedbackSchema = Joi.object({
  email: Joi.string().email().optional(),
  message: Joi.string().min(10).max(2000).required(),
  type: Joi.string().valid('bug', 'suggestion', 'question', 'autre').required(),
  page: Joi.string().max(200).optional(),
  importance: Joi.string().valid('faible', 'moyenne', 'forte', 'critique').default('moyenne')
});

const querySchema = Joi.object({
  type: Joi.string().valid('bug', 'suggestion', 'question', 'autre').optional(),
  importance: Joi.string().valid('faible', 'moyenne', 'forte', 'critique').optional(),
  page: Joi.string().max(200).optional(),
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0)
});

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: Soumettre un feedback utilisateur
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email de l'utilisateur (optionnel)
 *               message:
 *                 type: string
 *                 description: Message de feedback
 *               type:
 *                 type: string
 *                 enum: [bug, suggestion, question, autre]
 *                 description: Type de feedback
 *               page:
 *                 type: string
 *                 description: Page ou fonctionnalité concernée (optionnel)
 *               importance:
 *                 type: string
 *                 enum: [faible, moyenne, forte, critique]
 *                 description: Niveau d'importance du feedback
 *     responses:
 *       201:
 *         description: Feedback reçu
 *       400:
 *         description: Erreur de validation
 */

router.post('/', async (req, res) => {
  try {
    // Validation des données
    const { error, value } = feedbackSchema.validate(req.body);
    if (error) {
      logger.warn('Validation error on feedback submission', { 
        error: error.details,
        body: req.body,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.details.map(d => d.message)
      });
    }

    // Limitation du taux (basique)
    const userIp = req.ip || req.connection.remoteAddress;
    
    // Sauvegarde en base
    const feedback = await prisma.feedback.create({
      data: {
        ...value,
        userIp,
        userAgent: req.get('User-Agent')
      }
    });

    logger.info('Feedback submitted successfully', {
      feedbackId: feedback.id,
      type: feedback.type,
      importance: feedback.importance,
      userIp,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({ 
      success: true,
      message: 'Feedback reçu avec succès',
      id: feedback.id
    });

  } catch (error) {
    logger.error('Error saving feedback', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      error: 'Erreur lors de la sauvegarde du feedback',
      message: 'Une erreur interne est survenue'
    });
  }
});

/**
 * @swagger
 * /api/feedback:
 *   get:
 *     summary: Liste tous les feedbacks (admin, filtrable)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrer par type de feedback
 *       - in: query
 *         name: importance
 *         schema:
 *           type: string
 *         description: Filtrer par niveau d'importance
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: Filtrer par page concernée
 *     responses:
 *       200:
 *         description: Liste des feedbacks filtrés
 */

router.get('/', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    // Validation des paramètres de requête
    const { error, value } = querySchema.validate(req.query);
    if (error) {
      logger.warn('Invalid query parameters for feedback list', {
        error: error.details,
        query: req.query,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        error: 'Paramètres de requête invalides',
        details: error.details.map(d => d.message)
      });
    }

    const { type, importance, page, limit, offset } = value;
    
    // Construction de la clause WHERE
    const where = {};
    if (type) where.type = type;
    if (importance) where.importance = importance;
    if (page) where.page = { contains: page, mode: 'insensitive' };

    // Récupération avec pagination
    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.feedback.count({ where })
    ]);

    logger.info('Feedbacks retrieved successfully', {
      count: feedbacks.length,
      total,
      filters: { type, importance, page },
      pagination: { limit, offset },
      adminId: req.user.id,
      timestamp: new Date().toISOString()
    });

    res.json({
      feedbacks,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      filters: { type, importance, page }
    });

  } catch (error) {
    logger.error('Error retrieving feedbacks', {
      error: error.message,
      stack: error.stack,
      query: req.query,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des feedbacks',
      message: 'Une erreur interne est survenue'
    });
  }
});

/**
 * @swagger
 * /api/feedback/export:
 *   get:
 *     summary: Exporte les feedbacks filtrés au format CSV (admin)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrer par type de feedback
 *       - in: query
 *         name: importance
 *         schema:
 *           type: string
 *         description: Filtrer par niveau d'importance
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: Filtrer par page concernée
 *     responses:
 *       200:
 *         description: Fichier CSV exporté
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */

router.get('/export', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    // Validation des paramètres
    const { error, value } = querySchema.validate(req.query);
    if (error) {
      logger.warn('Invalid query parameters for feedback export', {
        error: error.details,
        query: req.query,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        error: 'Paramètres de requête invalides',
        details: error.details.map(d => d.message)
      });
    }

    const { type, importance, page } = value;
    const where = {};
    if (type) where.type = type;
    if (importance) where.importance = importance;
    if (page) where.page = { contains: page, mode: 'insensitive' };

    const feedbacks = await prisma.feedback.findMany({ 
      where, 
      orderBy: { created_at: 'desc' },
      take: 10000 // Limite de sécurité
    });

    if (feedbacks.length === 0) {
      return res.status(404).json({ error: 'Aucun feedback trouvé avec ces filtres' });
    }

    const fields = ['id', 'email', 'message', 'type', 'page', 'importance', 'created_at'];
    const parser = new Parser({ fields });
    const csv = parser.parse(feedbacks);

    logger.info('Feedback CSV export completed', {
      count: feedbacks.length,
      filters: { type, importance, page },
      adminId: req.user.id,
      timestamp: new Date().toISOString()
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`feedbacks-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);

  } catch (error) {
    logger.error('Error exporting feedbacks to CSV', {
      error: error.message,
      stack: error.stack,
      query: req.query,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      error: 'Erreur lors de l\'export CSV',
      message: 'Une erreur interne est survenue'
    });
  }
});

/**
 * @swagger
 * /api/feedback/export/xls:
 *   get:
 *     summary: Exporte les feedbacks filtrés au format XLSX (admin)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrer par type de feedback
 *       - in: query
 *         name: importance
 *         schema:
 *           type: string
 *         description: Filtrer par niveau d'importance
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: Filtrer par page concernée
 *     responses:
 *       200:
 *         description: Fichier XLSX exporté
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 */

router.get('/export/xls', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    // Validation des paramètres
    const { error, value } = querySchema.validate(req.query);
    if (error) {
      logger.warn('Invalid query parameters for feedback XLSX export', {
        error: error.details,
        query: req.query,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        error: 'Paramètres de requête invalides',
        details: error.details.map(d => d.message)
      });
    }

    const { type, importance, page } = value;
    const where = {};
    if (type) where.type = type;
    if (importance) where.importance = importance;
    if (page) where.page = { contains: page, mode: 'insensitive' };

    const feedbacks = await prisma.feedback.findMany({ 
      where, 
      orderBy: { created_at: 'desc' },
      take: 10000 // Limite de sécurité
    });

    if (feedbacks.length === 0) {
      return res.status(404).json({ error: 'Aucun feedback trouvé avec ces filtres' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Feedbacks');
    
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Message', key: 'message', width: 50 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Page', key: 'page', width: 20 },
      { header: 'Importance', key: 'importance', width: 12 },
      { header: 'Date', key: 'created_at', width: 20 }
    ];

    feedbacks.forEach(fb => worksheet.addRow(fb));

    logger.info('Feedback XLSX export completed', {
      count: feedbacks.length,
      filters: { type, importance, page },
      adminId: req.user.id,
      timestamp: new Date().toISOString()
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=feedbacks-${new Date().toISOString().split('T')[0]}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    logger.error('Error exporting feedbacks to XLSX', {
      error: error.message,
      stack: error.stack,
      query: req.query,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      error: 'Erreur lors de l\'export XLSX',
      message: 'Une erreur interne est survenue'
    });
  }
});

/**
 * @swagger
 * /api/feedback/export/pdf:
 *   get:
 *     summary: Exporte les feedbacks filtrés au format PDF (admin)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrer par type de feedback
 *       - in: query
 *         name: importance
 *         schema:
 *           type: string
 *         description: Filtrer par niveau d'importance
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: Filtrer par page concernée
 *     responses:
 *       200:
 *         description: Fichier PDF exporté
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 */

router.get('/export/pdf', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    // Validation des paramètres
    const { error, value } = querySchema.validate(req.query);
    if (error) {
      logger.warn('Invalid query parameters for feedback PDF export', {
        error: error.details,
        query: req.query,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        error: 'Paramètres de requête invalides',
        details: error.details.map(d => d.message)
      });
    }

    const { type, importance, page } = value;
    const where = {};
    if (type) where.type = type;
    if (importance) where.importance = importance;
    if (page) where.page = { contains: page, mode: 'insensitive' };

    const feedbacks = await prisma.feedback.findMany({ 
      where, 
      orderBy: { created_at: 'desc' },
      take: 1000 // Limite plus stricte pour PDF
    });

    if (feedbacks.length === 0) {
      return res.status(404).json({ error: 'Aucun feedback trouvé avec ces filtres' });
    }

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=feedbacks-${new Date().toISOString().split('T')[0]}.pdf`);
    doc.pipe(res);

    // En-tête du document
    doc.fontSize(18).text('Feedbacks Utilisateurs', { align: 'center' });
    doc.fontSize(12).text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
    doc.text(`Nombre de feedbacks: ${feedbacks.length}`, { align: 'center' });
    doc.moveDown(2);

    // Contenu
    feedbacks.forEach((fb, index) => {
      if (index > 0) {
        doc.addPage();
      }
      
      doc.fontSize(14).text(`Feedback #${fb.id}`, { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(10);
      doc.text(`Email: ${fb.email || 'Non renseigné'}`);
      doc.text(`Type: ${fb.type}`);
      doc.text(`Importance: ${fb.importance || 'Non renseigné'}`);
      doc.text(`Page: ${fb.page || 'Non renseigné'}`);
      doc.text(`Date: ${new Date(fb.created_at).toLocaleString('fr-FR')}`);
      doc.moveDown(0.5);
      
      doc.fontSize(11).text('Message:', { underline: true });
      doc.fontSize(10).text(fb.message, { width: 500 });
      doc.moveDown();
    });

    logger.info('Feedback PDF export completed', {
      count: feedbacks.length,
      filters: { type, importance, page },
      adminId: req.user.id,
      timestamp: new Date().toISOString()
    });

    doc.end();

  } catch (error) {
    logger.error('Error exporting feedbacks to PDF', {
      error: error.message,
      stack: error.stack,
      query: req.query,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      error: 'Erreur lors de l\'export PDF',
      message: 'Une erreur interne est survenue'
    });
  }
});

module.exports = router;
