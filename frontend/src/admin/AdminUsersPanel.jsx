import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function AdminUsersPanel({ token }) {
  const [admins, setAdmins] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("editor");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // 🔥 NUEVOS ESTADOS
  const [tempPassword, setTempPassword] = useState(null);
  const [showTempModal, setShowTempModal] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (token) loadAdmins();
  }, [token]);

  async function loadAdmins() {
    try {
      setLoading(true);
      const res = await api.getAdmins(token);
      setAdmins(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMsg({
        type: "error",
        text: "No tienes permiso para ver administradores."
      });
    } finally {
      setLoading(false);
    }
  }

  async function createAdmin(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setMsg(null);

      await api.createAdmin({ username, password, role }, token);

      setMsg({
        type: "success",
        text: "Administrador creado correctamente."
      });

      setUsername("");
      setPassword("");
      setRole("editor");

      await loadAdmins();
    } catch {
      setMsg({
        type: "error",
        text: "Error creando administrador."
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeAdmin(id) {
    const ok = confirm("¿Eliminar este administrador?");
    if (!ok) return;

    try {
      setDeletingId(id);
      setMsg(null);

      await api.deleteAdmin(id, token);

      setMsg({
        type: "success",
        text: "Administrador eliminado."
      });

      await loadAdmins();
    } catch (err) {
      setMsg({
        type: "error",
        text: err?.response?.data?.message || "Error eliminando administrador."
      });
    } finally {
      setDeletingId(null);
    }
  }

  // 🔥 RESET PASSWORD
  async function resetPassword(admin) {
    try {
      setMsg(null);

      // SUPERADMIN → abre modal
      if (admin.role === "superadmin") {
        setSelectedAdmin(admin);
        setShowPasswordModal(true);
        return;
      }

      // EDITOR → generar temporal
      const res = await api.resetAdminPassword(admin.id, {}, token);

      setTempPassword(res.data.tempPassword);
      setShowTempModal(true);

    } catch {
      setMsg({
        type: "error",
        text: "Error reseteando contraseña"
      });
    }
  }

  // 🔥 CAMBIO DE PASSWORD SUPERADMIN
  async function changePassword() {
    try {
      await api.resetAdminPassword(
        selectedAdmin.id,
        { currentPassword, newPassword },
        token
      );

      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");

      setMsg({
        type: "success",
        text: "Contraseña actualizada"
      });

    } catch {
      setMsg({
        type: "error",
        text: "Error cambiando contraseña"
      });
    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-700 to-blue-700 text-white p-6 shadow-xl">
        <h2 className="text-3xl font-black">
          Gestión de Administradores
        </h2>
      </div>

      {/* FORM */}
      <form onSubmit={createAdmin} className="space-y-4 bg-white p-6 rounded-3xl shadow">
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Usuario" required />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" required />
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="editor">Editor</option>
          <option value="superadmin">Super Admin</option>
        </select>
        <button disabled={saving}>
          {saving ? "Creando..." : "Crear"}
        </button>
      </form>

      {/* TABLE */}
      <table className="w-full bg-white rounded-3xl shadow">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {admins.map(a => (
            <tr key={a.id}>
              <td>{a.username}</td>
              <td>{a.role}</td>
              <td className="space-x-2">

                {/* 🔥 RESET */}
                <button onClick={() => resetPassword(a)}>
                  🔑 Reset
                </button>

                {/* 🔥 DELETE (ahora también aplica a superadmin) */}
                <button onClick={() => removeAdmin(a.id)}>
                  🗑 Eliminar
                </button>

              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 🔥 MODAL PASSWORD SUPERADMIN */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl space-y-3">
            <h3>Cambiar contraseña</h3>
            <input placeholder="Actual" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            <input placeholder="Nueva" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <button onClick={changePassword}>Guardar</button>
            <button onClick={() => setShowPasswordModal(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* 🔥 MODAL PASSWORD TEMPORAL */}
      {showTempModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl space-y-3">
            <h3>Contraseña temporal</h3>
            <p className="font-bold text-lg">{tempPassword}</p>
            <button onClick={() => setShowTempModal(false)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* MESSAGE */}
      {msg && <div>{msg.text}</div>}

    </div>
  );
}