// Middleware pour vérifier le rôle utilisateur
module.exports = function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Accès refusé : rôle manquant' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ message: `Accès refusé : rôle ${role} requis` });
    }
    next();
  };
};
