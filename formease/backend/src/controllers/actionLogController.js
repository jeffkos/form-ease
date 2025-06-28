// Contrôleur pour consulter les logs d'action admin (audit trail)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function isAdmin(req) {
  return req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
}

// Lister les logs d'action (admin/superadmin) avec pagination
exports.listActionLogs = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Accès refusé' });
  try {
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 100;
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.actionLog.findMany({ orderBy: { date: 'desc' }, include: { user: true }, skip, take: limit }),
      prisma.actionLog.count()
    ]);
    res.json({ logs, page, limit, total });
  } catch (error) {
    res.status(500).json({ message: 'Erreur logs action', error: error.message });
  }
};
