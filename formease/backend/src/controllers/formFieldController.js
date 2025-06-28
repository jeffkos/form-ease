// Contrôleur des champs de formulaire pour FormEase
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Ajouter un champ à un formulaire
exports.addField = async (req, res) => {
  try {
    const { formId } = req.params;
    const { type, label_fr, label_en, options, is_required, order, style, placeholder_fr, placeholder_en, default_value } = req.body;
    if (!type || !label_fr || !label_en || order === undefined) {
      return res.status(400).json({ message: 'Champs obligatoires manquants.' });
    }
    const field = await prisma.formField.create({
      data: {
        form_id: parseInt(formId),
        type,
        label_fr,
        label_en,
        options: options || undefined,
        is_required: !!is_required,
        order,
        style: style || undefined,
        placeholder_fr: placeholder_fr || undefined,
        placeholder_en: placeholder_en || undefined,
        default_value: default_value || undefined
      }
    });
    res.status(201).json({ message: 'Champ ajouté', field });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Lister les champs d'un formulaire avec pagination
exports.listFields = async (req, res) => {
  try {
    const { formId } = req.params;
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 100;
    const skip = (page - 1) * limit;
    const [fields, total] = await Promise.all([
      prisma.formField.findMany({
        where: { form_id: parseInt(formId) },
        orderBy: { order: 'asc' },
        skip,
        take: limit
      }),
      prisma.formField.count({ where: { form_id: parseInt(formId) } })
    ]);
    res.json({ fields, page, limit, total });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Modifier un champ
exports.updateField = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const data = req.body;
    const field = await prisma.formField.update({
      where: { id: parseInt(fieldId) },
      data
    });
    res.json({ message: 'Champ modifié', field });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Supprimer un champ
exports.deleteField = async (req, res) => {
  try {
    const { fieldId } = req.params;
    await prisma.formField.delete({ where: { id: parseInt(fieldId) } });
    res.json({ message: 'Champ supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
