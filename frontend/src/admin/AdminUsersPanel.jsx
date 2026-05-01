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
      setMsg({ type: "error", text: "No tienes permiso." });
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

      setMsg({ type: "success", text: "Administrador creado." });

      setUsername("");
      setPassword("");
      setRole("editor");

      await loadAdmins();
    } catch {
      setMsg({ type: "error", text: "Error creando administrador." });
    } finally {
      setSaving(false);
    }
  }

  async function removeAdmin(id) {
    if (!confirm("¿Eliminar este administrador?")) return;

    try {
      setDeletingId(id);
      await api.deleteAdmin(id, token);
      setMsg({ type: "success", text: "Administrador eliminado." });
      await loadAdmins();
    } catch (err) {
      setMsg({
        type: "error",
        text: err?.response?.data?.message || "Error eliminando."
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function resetPassword(admin) {
    try {
      if (admin.role === "superadmin") {
        setSelectedAdmin(admin);
        setShowPasswordModal(true);
        return;
      }

      const res = await api.resetAdminPassword(admin.id, {}, token);
      setTempPassword(res.data.tempPassword);
      setShowTempModal(true);
    } catch {
      setMsg({ type: "error", text: "Error reseteando contraseña" });
    }
  }

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

      setMsg({ type: "success", text: "Contraseña actualizada" });
    } catch {
      setMsg({ type: "error", text: "Error cambiando contraseña" });
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
      <form
        onSubmit={createAdmin}
        className="grid md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow border dark:border-slate-800"
      >
        <input
          className="border rounded-xl px-4 py-2 dark:bg-slate-800 dark:border-slate-700"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Usuario"
          required
        />

        <input
          type="password"
          className="border rounded-xl px-4 py-2 dark:bg-slate-800 dark:border-slate-700"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Contraseña"
          required
        />

        <select
          className="border rounded-xl px-4 py-2 dark:bg-slate-800 dark:border-slate-700"
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          <option value="editor">Editor</option>
          <option value="superadmin">Super Admin</option>
        </select>

        <button
          disabled={saving}
          className="bg-indigo-600 text-white rounded-xl px-4 py-2 font-bold hover:bg-indigo-700 transition"
        >
          {saving ? "Creando..." : "Crear"}
        </button>
      </form>

      {/* TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow overflow-hidden border dark:border-slate-800">
        <table className="w-full">
          <thead className="bg-slate-100 dark:bg-slate-800 text-left">
            <tr>
              <th className="p-3">Usuario</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(a => (
              <tr key={a.id} className="border-t dark:border-slate-700">
                <td className="p-3">{a.username}</td>
                <td className="p-3">{a.role}</td>
                <td className="p-3 space-x-2">

                  <button
                    onClick={() => resetPassword(a)}
                    className="text-yellow-600 hover:underline"
                  >
                    🔑 Reset
                  </button>

                  <button
                    onClick={() => removeAdmin(a.id)}
                    disabled={deletingId === a.id}
                    className="text-red-600 hover:underline"
                  >
                    🗑 Eliminar
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL SUPERADMIN */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-md space-y-3">
            <h3 className="font-bold text-lg">Cambiar contraseña</h3>

            <input
              placeholder="Actual"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full border rounded-xl px-4 py-2 dark:bg-slate-800"
            />

            <input
              placeholder="Nueva"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full border rounded-xl px-4 py-2 dark:bg-slate-800"
            />

            <button
              onClick={changePassword}
              className="w-full bg-indigo-600 text-white rounded-xl py-2"
            >
              Guardar
            </button>

            <button onClick={() => setShowPasswordModal(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MODAL TEMP */}
      {showTempModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl text-center">
            <h3 className="font-bold mb-2">Contraseña temporal</h3>
            <p className="text-xl font-mono">{tempPassword}</p>
            <button onClick={() => setShowTempModal(false)}>Cerrar</button>
          </div>
        </div>
      )}

      {msg && (
        <div className="text-sm text-center">
          {msg.text}
        </div>
      )}

    </div>
  );
}