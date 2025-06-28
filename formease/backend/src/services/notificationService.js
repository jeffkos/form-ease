// Service de notifications (création, lecture, marquage)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createNotification = async ({ userId, type, message }) => {
  return prisma.notification.create({
    data: { user_id: userId, type, message }
  });
};

exports.listNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Erreur notifications', error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({ where: { id: parseInt(id) }, data: { read: true } });
    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur notification', error: error.message });
  }
};
