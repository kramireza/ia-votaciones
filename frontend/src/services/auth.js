// src/services/auth.js
export function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Payload = token.split(".")[1];
    const decoded = atob(base64Payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(decoded)));
  } catch (err) {
    console.error("parseJwt error:", err);
    return null;
  }
}

export function getRoleFromToken(token) {
  const payload = parseJwt(token);
  // Dependiendo del payload, puede venir en 'role' o en 'roles' u otro campo.
  if (!payload) return null;
  if (payload.role) return payload.role;
  if (Array.isArray(payload.roles) && payload.roles.length > 0) return payload.roles[0];
  return null;
}
