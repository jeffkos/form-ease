// Contrôleur RGPD : export et suppression des données utilisateur
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Export des données utilisateur (JSON) avec pagination sur les formulaires et inscriptions
exports.exportUserData = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 20;
    const skip = (page - 1) * limit;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        forms: {
          include: {
            submissions: { skip, take: limit },
            fields: true
          }
        },
        payments: true
      }
    });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    // Compter le total d'inscriptions pour tous les formulaires de l'utilisateur
    const totalSubmissions = await prisma.submission.count({ where: { form: { user_id: userId } } });
    res.json({ user, page, limit, totalSubmissions });
  } catch (error) {
    res.status(500).json({ message: 'Erreur export données', error: error.message });
  }
};

// Suppression complète du compte utilisateur et de ses données
exports.deleteUserAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    // Suppression en cascade : submissions, forms, payments, user
    await prisma.submission.deleteMany({ where: { form: { user_id: userId } } });
    await prisma.formField.deleteMany({ where: { form: { user_id: userId } } });
    await prisma.form.deleteMany({ where: { user_id: userId } });
    await prisma.payment.deleteMany({ where: { user_id: userId } });
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'Compte et données supprimés' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur suppression compte', error: error.message });
  }
};
