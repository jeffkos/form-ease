// Contrôleur CRUD des templates d'email (admin/superadmin uniquement)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function isAdmin(req) {
  return req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
}

// Créer un template
exports.createTemplate = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Accès refusé' });
  try {
    const { name, type, subject, html, language, active } = req.body;
    const template = await prisma.emailTemplate.create({
      data: { name, type, subject, html, language, active }
    });
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: 'Erreur création template', error: error.message });
  }
};

// Lister tous les templates
exports.listTemplates = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Accès refusé' });
  try {
    const templates = await prisma.emailTemplate.findMany();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Erreur liste templates', error: error.message });
  }
};

// Lire un template
exports.getTemplate = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Accès refusé' });
  try {
    const { id } = req.params;
    const template = await prisma.emailTemplate.findUnique({ where: { id: parseInt(id) } });
    if (!template) return res.status(404).json({ message: 'Template non trouvé' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lecture template', error: error.message });
  }
};

// Modifier un template
exports.updateTemplate = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Accès refusé' });
  try {
    const { id } = req.params;
    const { name, type, subject, html, language, active } = req.body;
    const template = await prisma.emailTemplate.update({
      where: { id: parseInt(id) },
      data: { name, type, subject, html, language, active }
    });
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: 'Erreur modification template', error: error.message });
  }
};

// Supprimer un template
exports.deleteTemplate = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Accès refusé' });
  try {
    const { id } = req.params;
    await prisma.emailTemplate.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Template supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur suppression template', error: error.message });
  }
};

// Preview d'un template avec variables (POST)
exports.previewTemplate = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Accès refusé' });
  try {
    const { id } = req.params;
    const variables = req.body || {};
    const template = await prisma.emailTemplate.findUnique({ where: { id: parseInt(id) } });
    if (!template) return res.status(404).json({ message: 'Template non trouvé' });
    // Remplacement simple des variables {{var}}
    let html = template.html;
    Object.entries(variables).forEach(([k, v]) => {
      html = html.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), v);
    });
    res.send(html);
  } catch (error) {
    res.status(500).json({ message: 'Erreur preview template', error: error.message });
  }
};
