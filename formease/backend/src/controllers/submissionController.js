// Contrôleur des inscriptions (submissions) pour FormEase
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const generateMailTemplate = require('../utils/mailTemplate');
const { t } = require('../utils/i18n');
const { logAction } = require('../utils/actionLog');
const quota = require('../middleware/quota');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const errorHandler = require('../middleware/errorHandler');
// Configuration SMTP O2switch
const smtpTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp1.o2switch.net',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Vérifie si l'utilisateur est admin/superadmin ou propriétaire du formulaire lié à la soumission
async function canManageSubmission(user, submissionId) {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'superadmin') return true;
  const submission = await prisma.submission.findUnique({
    where: { id: parseInt(submissionId) },
    include: { form: true }
  });
  return submission && submission.form && submission.form.user_id === user.id;
}

// Valider une inscription
exports.validateSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    if (!(await canManageSubmission(req.user, submissionId))) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    const submission = await prisma.submission.update({
      where: { id: parseInt(submissionId) },
      data: {
        status: 'validated',
        validated_at: new Date(),
        notified: true,
        notified_at: new Date()
      }
    });
    // Log d'action admin
    await logAction({
      userId: req.user?.id || null,
      action: 'validate_submission',
      entity: 'Submission',
      entityId: submission.id,
      details: { email: submission.data.email, nom: submission.data.nom }
    });
    // Notification utilisateur (exemple)
    await notificationService.createNotification({
      userId: submission.form.user_id,
      type: 'submission_validated',
      message: `Inscription validée pour ${submission.data.email || ''}`
    });
    // Récupérer l'email à notifier
    const email = submission.data.email;
    const nom = submission.data.nom || '';
    const langue = submission.data.langue || 'fr';
    const logoUrl = submission.data.logoUrl || '';
    const contact = submission.data.contact || '';
    // Sélection dynamique du template d'email
    let subject, html;
    const template = await prisma.emailTemplate.findFirst({
      where: { type: 'validation', language: langue, active: true },
      orderBy: { updated_at: 'desc' }
    });
    if (template) {
      // Remplacement simple des variables {{nom}}, {{logoUrl}}, {{contact}}
      html = template.html
        .replace(/{{\s*nom\s*}}/g, nom)
        .replace(/{{\s*logoUrl\s*}}/g, logoUrl)
        .replace(/{{\s*contact\s*}}/g, contact);
      subject = template.subject.replace(/{{\s*nom\s*}}/g, nom);
    } else {
      // Fallback sur le template JS
      ({ subject, html } = generateMailTemplate({ nom, langue, logoUrl, contact }));
    }
    if (email) {
      const msg = {
        to: email,
        from: process.env.SMTP_FROM || 'no-reply@formease.com',
        subject,
        text: subject,
        html
      };
      try {
        await smtpTransport.sendMail(msg);
      } catch (e) {
        // Ne bloque pas la validation si l'envoi échoue
      }
    }
    res.json({ message: 'Inscription validée et notification envoyée', submission });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Rejeter (mettre à la corbeille) une inscription
exports.trashSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    if (!(await canManageSubmission(req.user, submissionId))) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    const submission = await prisma.submission.update({
      where: { id: parseInt(submissionId) },
      data: { status: 'trashed' }
    });
    await logAction({
      userId: req.user?.id || null,
      action: 'trash_submission',
      entity: 'Submission',
      entityId: submission.id,
      details: { email: submission.data.email, nom: submission.data.nom }
    });
    res.json({ message: 'Inscription mise à la corbeille', submission });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Supprimer définitivement une inscription
exports.deleteSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    if (!(await canManageSubmission(req.user, submissionId))) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    if (isNaN(submissionId) || parseInt(submissionId) <= 0) {
      return res.status(400).json({ message: 'ID invalide' });
    }
    const deleted = await prisma.submission.delete({ where: { id: parseInt(submissionId) } });
    await logAction({
      userId: req.user?.id || null,
      action: 'delete_submission',
      entity: 'Submission',
      entityId: deleted.id,
      details: { email: deleted.data.email, nom: deleted.data.nom }
    });
    res.json({ message: 'Inscription supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Exporter les inscrits d'un formulaire en CSV
exports.exportSubmissionsCSV = async (req, res) => {
  try {
    const { formId } = req.params;
    if (isNaN(formId) || parseInt(formId) <= 0) {
      return res.status(400).json({ message: 'ID formulaire invalide' });
    }
    // Vérification d'autorisation : admin/superadmin ou propriétaire du formulaire
    const form = await prisma.form.findUnique({ where: { id: parseInt(formId) } });
    if (!form) return res.status(404).json({ message: 'Formulaire introuvable' });
    if (!(req.user && (req.user.role === 'admin' || req.user.role === 'superadmin' || form.user_id === req.user.id))) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    const langue = req.query.lang || 'fr';
    // Pagination
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 1000;
    const skip = (page - 1) * limit;
    // Récupérer toutes les soumissions du formulaire (pour les champs dynamiques)
    const allSubmissions = await prisma.submission.findMany({ where: { form_id: parseInt(formId) } });
    // Champs dynamiques : tous les champs rencontrés dans les données
    const allFields = Array.from(new Set(allSubmissions.flatMap(s => Object.keys(s.data))));
    // Champs à exporter (paramètre fields ou tous les champs dynamiques)
    const fields = req.query.fields ? req.query.fields.split(',') : allFields;
    // Pagination sur les soumissions
    const submissions = allSubmissions.slice(skip, skip + limit);
    // Traduction des entêtes CSV
    const fieldLabels = fields.map(f => t(`form.field.${f}`, langue, f));
    const parser = new Parser({ fields: fields.map((f, i) => ({ label: fieldLabels[i], value: f })) });
    const csv = parser.parse(submissions.map(s => s.data));
    await logAction({
      userId: req.user?.id || null,
      action: 'export_submissions_csv',
      entity: 'Form',
      entityId: parseInt(formId),
      details: { count: submissions.length, fields, page, limit, total: allSubmissions.length }
    });
    res.header('Content-Type', 'text/csv');
    res.attachment('inscrits.csv');
    // Ajout d'une ligne d'info pagination en commentaire CSV
    res.write(`# page: ${page}, limit: ${limit}, total: ${allSubmissions.length}\n`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: t('error.export.csv', req.query.lang || 'fr'), error: error.message });
  }
};

// Exporter les inscrits d'un formulaire en PDF
exports.exportSubmissionsPDF = async (req, res) => {
  try {
    const { formId } = req.params;
    if (isNaN(formId) || parseInt(formId) <= 0) {
      return res.status(400).json({ message: 'ID formulaire invalide' });
    }
    // Vérification d'autorisation : admin/superadmin ou propriétaire du formulaire
    const form = await prisma.form.findUnique({ where: { id: parseInt(formId) } });
    if (!form) return res.status(404).json({ message: 'Formulaire introuvable' });
    if (!(req.user && (req.user.role === 'admin' || req.user.role === 'superadmin' || form.user_id === req.user.id))) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    const langue = req.query.lang || 'fr';
    // Pagination
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 1000;
    const skip = (page - 1) * limit;
    // Récupérer toutes les soumissions du formulaire (pour les champs dynamiques)
    const allSubmissions = await prisma.submission.findMany({ where: { form_id: parseInt(formId) } });
    // Champs dynamiques : tous les champs rencontrés dans les données
    const allFields = Array.from(new Set(allSubmissions.flatMap(s => Object.keys(s.data))));
    // Champs à exporter (paramètre fields ou tous les champs dynamiques)
    const fields = req.query.fields ? req.query.fields.split(',') : allFields;
    // Pagination sur les soumissions
    const submissions = allSubmissions.slice(skip, skip + limit);
    const doc = new PDFDocument();
    await logAction({
      userId: req.user?.id || null,
      action: 'export_submissions_pdf',
      entity: 'Form',
      entityId: parseInt(formId),
      details: { count: submissions.length, fields, page, limit, total: allSubmissions.length }
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="inscrits.pdf"');
    doc.pipe(res);
    doc.fontSize(18).text(t('export.pdf.title', langue), { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Page: ${page} / Total: ${allSubmissions.length} / Par page: ${limit}`);
    doc.moveDown();
    // En-têtes dynamiques
    doc.fontSize(12).text(fields.map(f => t(`form.field.${f}`, langue, f)).join(' | '));
    doc.moveDown();
    submissions.forEach((s, i) => {
      const data = s.data;
      let line = `${(skip + i + 1)}. `;
      fields.forEach(f => {
        line += `${t(`form.field.${f}`, langue, f)}: ${data[f] !== undefined ? data[f] : ''}  `;
      });
      doc.fontSize(12).text(line);
      doc.moveDown(0.5);
    });
    doc.end();
  } catch (error) {
    res.status(500).json({ message: t('error.export.pdf', req.query.lang || 'fr'), error: error.message });
  }
};

// Création d'une inscription (squelette minimal pour éviter l'erreur de route)
exports.createSubmission = async (req, res) => {
  res.status(501).json({ message: 'Non implémenté : création d\'inscription.' });
};

// Dans vos routes (exemple):
// router.post('/forms', quota.checkFormQuota, formController.createForm);
// router.post('/submissions', quota.checkSubmissionQuota, submissionController.submit);
// router.get('/forms/:formId/export/csv', quota.checkExportQuota, submissionController.exportSubmissionsCSV);
// router.get('/forms/:formId/export/pdf', quota.checkExportQuota, submissionController.exportSubmissionsPDF);
// À la fin de app.js :
// app.use(errorHandler);
