import React, {
  useEffect,
  useState
} from "react";
import api from "../services/api";

export default function AdminUsersPanel({
  token
}) {
  const [admins, setAdmins] =
    useState([]);

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [role, setRole] =
    useState("editor");

  const [msg, setMsg] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  useEffect(() => {
    if (token) {
    loadAdmins();
    }
  }, [token]);

  async function loadAdmins() {
    try {
      setLoading(true);

      const res =
        await api.getAdmins(
          token
        );

      setAdmins(
        Array.isArray(
          res.data
        )
          ? res.data
          : []
      );

    } catch {
      setMsg({
        type: "error",
        text:
          "No tienes permiso para ver administradores."
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

      await api.createAdmin(
        {
          username,
          password,
          role
        },
        token
      );

      setMsg({
        type: "success",
        text:
          "Administrador creado correctamente."
      });

      setUsername("");
      setPassword("");
      setRole(
        "editor"
      );

      await loadAdmins();

    } catch {
      setMsg({
        type: "error",
        text:
          "Error creando administrador."
      });

    } finally {
      setSaving(false);
    }
  }

  async function removeAdmin(id) {
    const ok = confirm(
      "¿Eliminar este administrador?"
    );

    if (!ok) return;

    try {
      setDeletingId(id);
      setMsg(null);

      await api.deleteAdmin(
        id,
        token
      );

      setMsg({
        type: "success",
        text:
          "Administrador eliminado."
      });

      await loadAdmins();

    } catch {
      setMsg({
        type: "error",
        text:
          "Error eliminando administrador."
      });

    } finally {
      setDeletingId(
        null
      );
    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-700 to-blue-700 text-white p-6 shadow-xl">

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold mb-4">
          🔐 Seguridad administrativa
        </div>

        <h2 className="text-3xl font-black">
          Gestión de Administradores
        </h2>

        <p className="text-indigo-100 mt-2">
          Crea, administra y controla accesos del sistema.
        </p>
      </div>

      {/* FORM */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-xl p-6">

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-5">
          Nuevo administrador
        </h3>

        <form
          onSubmit={
            createAdmin
          }
          className="space-y-4"
        >

          <div className="grid md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Usuario
              </label>

              <input
                className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition bg-white text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                placeholder="Usuario"
                value={
                  username
                }
                onChange={(
                  e
                ) =>
                  setUsername(
                    e.target
                      .value
                  )
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Contraseña
              </label>

              <input
                className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition bg-white text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                type="password"
                placeholder="Contraseña"
                value={
                  password
                }
                onChange={(
                  e
                ) =>
                  setPassword(
                    e.target
                      .value
                  )
                }
                required
              />
            </div>

          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Rol
            </label>

            <select
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition bg-white text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              value={role}
              onChange={(
                e
              ) =>
                setRole(
                  e.target
                    .value
                )
              }
            >
              <option value="editor">
                Editor
              </option>

              <option value="superadmin">
                Super Admin
              </option>
            </select>
          </div>

          <button
            disabled={
              saving
            }
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition disabled:opacity-60"
          >
            {saving
              ? "Creando..."
              : "➕ Crear administrador"}
          </button>

        </form>
      </div>

      {/* TABLE */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-xl overflow-hidden">

        <div className="p-5 border-b dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Administradores existentes
          </h3>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <div className="w-10 h-10 mx-auto rounded-full border-b-4 border-indigo-600 animate-spin"></div>

            <p className="mt-4 text-slate-500 dark:text-slate-400">
              Cargando administradores...
            </p>
          </div>
        ) : admins.length === 0 ? (
          <div className="p-10 text-center text-slate-500 dark:text-slate-400">
            No hay administradores registrados.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[720px] text-sm">

              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="p-4 text-left">
                    Usuario
                  </th>

                  <th className="p-4 text-left">
                    Rol
                  </th>

                  <th className="p-4 text-left">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {admins.map(
                  (
                    a,
                    i
                  ) => (
                    <tr
                      key={
                        a.id
                      }
                      className={`border-t dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                        i % 2 === 0
                          ? "bg-white dark:bg-slate-900"
                          : "bg-slate-50/50 dark:bg-slate-800/40"
                      }`}
                    >
                      <td className="p-4 font-semibold text-slate-800 dark:text-white">
                        {
                          a.username
                        }
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            a.role ===
                            "superadmin"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                          }`}
                        >
                          {a.role ===
                          "superadmin"
                            ? "Super Admin"
                            : "Editor"}
                        </span>
                      </td>

                      <td className="p-4">
                        {a.role !==
                          "superadmin" && (
                          <button
                            onClick={() =>
                              removeAdmin(
                                a.id
                              )
                            }
                            disabled={
                              deletingId ===
                              a.id
                            }
                            className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition disabled:opacity-60"
                          >
                            {deletingId ===
                            a.id
                              ? "Eliminando..."
                              : "🗑 Eliminar"}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>

            </table>
          </div>
        )}
      </div>

      {/* MESSAGE */}
      {msg && (
        <div
          className={`rounded-2xl px-4 py-3 border text-sm font-medium ${
            msg.type ===
            "error"
              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30"
              : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30"
          }`}
        >
          {msg.text}
        </div>
      )}

    </div>
  );
}