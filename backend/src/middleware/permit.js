// backend/src/middleware/permit.js
module.exports = function permit(...allowedRoles) {
  return (req, res, next) => {
    const admin = req.admin;
    if (!admin) return res.status(401).json({ message: "No autenticado" });

    // Si el payload trae role como string o en otra forma, adaptamos:
    const role = admin.role || (admin.roles && admin.roles[0]) || null;

    if (!role) {
      return res.status(403).json({ message: "No autorizado (sin rol)" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    next();
  };
};
