// Contrôleur d'archivage avancé pour FormEase
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function logArchiveAction(userId, entity, entityId, action) {
  return prisma.archiveLog.create({
    data: { user_id: userId, entity, entity_id: entityId, action }
  });
}

// Lister les archives (submissions ou forms) avec pagination
exports.listArchives = async (req, res) => {
  try {
    const { type } = req.query; // 'submission' ou 'form'
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 100;
    const skip = (page - 1) * limit;
    let archives = [], total = 0;
    if (type === 'submission') {
      [archives, total] = await Promise.all([
        prisma.submission.findMany({ where: { archived: true }, skip, take: limit }),
        prisma.submission.count({ where: { archived: true } })
      ]);
    } else if (type === 'form') {
      [archives, total] = await Promise.all([
        prisma.form.findMany({ where: { archived: true }, skip, take: limit }),
        prisma.form.count({ where: { archived: true } })
      ]);
    } else {
      return res.status(400).json({ message: 'Type requis (submission|form)' });
    }
    res.json({ archives, page, limit, total });
  } catch (error) {
    res.status(500).json({ message: 'Erreur liste archives', error: error.message });
  }
};

// Archiver une submission ou un form
exports.archiveEntity = async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = req.user?.id || null;
    let entity;
    if (type === 'submission') {
      entity = await prisma.submission.update({
        where: { id: parseInt(id) },
        data: { archived: true, archived_at: new Date() }
      });
    } else if (type === 'form') {
      entity = await prisma.form.update({
        where: { id: parseInt(id) },
        data: { archived: true, archived_at: new Date() }
      });
    } else {
      return res.status(400).json({ message: 'Type requis (submission|form)' });
    }
    await logArchiveAction(userId, type, entity.id, 'archive');
    res.json({ message: `${type} archivé`, entity });
  } catch (error) {
    res.status(500).json({ message: 'Erreur archivage', error: error.message });
  }
};

// Restaurer une archive
exports.restoreEntity = async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = req.user?.id || null;
    let entity;
    if (type === 'submission') {
      entity = await prisma.submission.update({
        where: { id: parseInt(id) },
        data: { archived: false, archived_at: null }
      });
    } else if (type === 'form') {
      entity = await prisma.form.update({
        where: { id: parseInt(id) },
        data: { archived: false, archived_at: null }
      });
    } else {
      return res.status(400).json({ message: 'Type requis (submission|form)' });
    }
    await logArchiveAction(userId, type, entity.id, 'restore');
    res.json({ message: `${type} restauré`, entity });
  } catch (error) {
    res.status(500).json({ message: 'Erreur restauration', error: error.message });
  }
};

// Suppression définitive d'une archive
exports.deleteEntity = async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = req.user?.id || null;
    if (type === 'submission') {
      await prisma.submission.delete({ where: { id: parseInt(id) } });
    } else if (type === 'form') {
      await prisma.form.delete({ where: { id: parseInt(id) } });
    } else {
      return res.status(400).json({ message: 'Type requis (submission|form)' });
    }
    await logArchiveAction(userId, type, parseInt(id), 'delete');
    res.json({ message: `${type} supprimé définitivement` });
  } catch (error) {
    res.status(500).json({ message: 'Erreur suppression définitive', error: error.message });
  }
};

// Lister les logs d'archivage avec pagination
exports.listArchiveLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 100;
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.archiveLog.findMany({ orderBy: { date: 'desc' }, include: { user: true }, skip, take: limit }),
      prisma.archiveLog.count()
    ]);
    res.json({ logs, page, limit, total });
  } catch (error) {
    res.status(500).json({ message: 'Erreur logs archivage', error: error.message });
  }
};
