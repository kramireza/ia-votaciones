// backend/src/middleware/permit.js

module.exports = function permit(...allowedRoles) {
  return (req, res, next) => {

    const admin = req.admin;

    if (!admin) {
      return res.status(401).json({
        message: "No autenticado"
      });
    }

    // 🔐 Obtener rol de forma segura
    let role = null;

    if (typeof admin.role === "string") {
      role = admin.role;
    } else if (Array.isArray(admin.roles)) {
      role = admin.roles[0];
    }

    if (!role) {
      return res.status(403).json({
        message: "No autorizado (sin rol válido)"
      });
    }

    // 🔥 Normalizar
    role = role.toLowerCase();

    const normalizedAllowed = allowedRoles.map(r =>
      String(r).toLowerCase()
    );

    // 🔐 Validar rol permitido
    if (!normalizedAllowed.includes(role)) {
      return res.status(403).json({
        message: "Permisos insuficientes"
      });
    }

    next();
  };
};