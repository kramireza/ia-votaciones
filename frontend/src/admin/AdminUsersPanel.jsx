import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function AdminUsersPanel({ token }) {
  const [admins, setAdmins] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("editor");
  const [msg, setMsg] = useState(null);

  async function loadAdmins() {
    try {
      const res = await api.getAdmins(token);
      setAdmins(res.data);
    } catch {
      setMsg({ type: "error", text: "No tienes permiso para ver admins." });
    }
  }

    useEffect(() => {
        async function fetchAdmins() {
            try {
                const res = await api.getAdmins(token);
                setAdmins(res.data);
            } catch {
                setMsg({ type: "error", text: "No tienes permiso para ver admins." });
            }
        }

        fetchAdmins();
    }, [token]);



  async function createAdmin(e) {
    e.preventDefault();

    try {
      await api.createAdmin({ username, password, role }, token);
      setMsg({ type: "success", text: "Admin creado." });
      loadAdmins();
      setUsername("");
      setPassword("");
      setRole("editor");
    } catch {
      setMsg({ type: "error", text: "Error creando admin." });
    }
  }

  async function removeAdmin(id) {
    if (!confirm("¿Eliminar este admin?")) return;

    try {
      await api.deleteAdmin(id, token);
      loadAdmins();
    } catch {
      alert("Error eliminando admin");
    }
  }

  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-bold">Gestión de Administradores</h2>

      {/* Crear admin */}
      <form onSubmit={createAdmin} className="p-4 bg-white border rounded shadow">
        <h3 className="font-semibold mb-2">Nuevo administrador</h3>

        <input
          className="input w-full mb-2"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          className="input w-full mb-2"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <select
          className="input w-full mb-2"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="editor">Editor</option>
          <option value="superadmin">Super Admin</option>
        </select>

        <button className="bg-indigo-600 text-white px-4 py-2 rounded">
          Crear admin
        </button>

        {msg && (
          <p className={msg.type === "error" ? "text-red-600" : "text-green-600"}>
            {msg.text}
          </p>
        )}
      </form>

      {/* Lista de admins */}
      <div className="p-4 bg-white border rounded shadow">
        <h3 className="font-semibold mb-3">Administradores existentes</h3>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Usuario</th>
              <th className="p-2 text-left">Rol</th>
              <th className="p-2">Acción</th>
            </tr>
          </thead>

          <tbody>
            {admins.map((a) => (
              <tr key={a.id} className="border-b">
                <td className="p-2">{a.username}</td>
                <td className="p-2">{a.role}</td>
                <td className="p-2">
                  {a.role !== "superadmin" && (
                    <button
                      onClick={() => removeAdmin(a.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded"
                    >
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
