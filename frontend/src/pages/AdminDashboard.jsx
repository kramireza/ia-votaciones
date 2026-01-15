// src/pages/AdminDashboard.jsx
import React, { useState, Suspense, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getRoleFromToken } from "../services/auth";

// ⬇️ Panels con lazy load (sin cambios en nombres)
const ElectionsPanel = React.lazy(() => import("../admin/ElectionsPanel"));
const VotesPanel = React.lazy(() => import("../admin/VotesPanel"));
const StudentsPanel = React.lazy(() => import("../admin/StudentsPanel"));
const ResultsPanel = React.lazy(() => import("../admin/ResultsPanel.jsx"));
const AdminUsersPanel = React.lazy(() => import("../admin/AdminUsersPanel.jsx"));
const AdminLogsPanel = React.lazy(() => import("../admin/AdminLogPanel.jsx"));
const AdminRequestsPanel = React.lazy(() => import("../admin/AdminRequestsPanel.jsx"));

export default function AdminDashboard({ token, onLogout }) {
  // tab por defecto
  const [tab, setTab] = useState("elections");
  const navigate = useNavigate();

  // Determinar rol desde el token
  const role = getRoleFromToken(token);

  // Pestañas permitidas para el rol 'editor' (ahora incluye 'requests')
  const editorAllowedTabs = ["elections", "students", "results", "requests"];

  // Si el rol es 'editor' y la tab actual NO está permitida, forzar a la primera permitida.
  useEffect(() => {
    if (role === "editor" && !editorAllowedTabs.includes(tab)) {
      setTab("elections");
    }
    // Si no hay token o rol desconocido, redirigir a login (no rompemos flujo actual)
    if (!token) {
      navigate("/admin/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, token]);

  function logout() {
    onLogout();
    navigate("/admin/login");
  }

  // Helper para saber si debe renderizar una pestaña en UI
  const canView = (t) => {
    if (role === "editor") return editorAllowedTabs.includes(t);
    // superadmin (u otros roles) ven todo
    return true;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR */}
      <div className="w-72 bg-indigo-700 text-white p-6 space-y-5 shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Panel Admin</h2>

        {canView("elections") && (
          <button onClick={() => setTab("elections")} className="w-full text-left hover:underline">
            🗳 Elecciones
          </button>
        )}

        {/* Votos: lo dejamos visible sólo para superadmin (o quienes no sean 'editor') */}
        {canView("votes") && (
          <button onClick={() => setTab("votes")} className="w-full text-left hover:underline">
            📊 Votos
          </button>
        )}

        {canView("students") && (
          <button onClick={() => setTab("students")} className="w-full text-left hover:underline">
            🧑‍🎓 Estudiantes
          </button>
        )}

        {canView("results") && (
          <button onClick={() => setTab("results")} className="w-full text-left hover:underline">
            📈 Resultados
          </button>
        )}

        {/* Solicitudes: ahora controlado por canView, por lo que editors también la verán */}
        {canView("requests") && (
          <button onClick={() => setTab("requests")} className="w-full text-left hover:underline">
            📬 Solicitudes
          </button>
        )}

        {/* Administradores y logs: sólo para superadmin (no se muestran a editor) */}
        {canView("admins") && (
          <button onClick={() => setTab("admins")} className="w-full text-left hover:underline">
            👤 Administradores
          </button>
        )}

        {canView("logs") && (
          <button onClick={() => setTab("logs")} className="w-full text-left hover:underline">
            📝 Logs de actividad
          </button>
        )}

        <button
          onClick={logout}
          className="bg-red-600 px-3 py-2 rounded-lg mt-10 shadow"
        >
          Cerrar sesión
        </button>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 p-8 overflow-auto">
        <Suspense fallback={<p>Cargando...</p>}>
          {/* Render condicionado: si el rol no puede ver la pestaña, no la renderizamos */}
          {tab === "elections" && canView("elections") && <ElectionsPanel token={token} />}
          {tab === "votes" && canView("votes") && <VotesPanel token={token} />}
          {tab === "students" && canView("students") && <StudentsPanel token={token} />}
          {tab === "results" && canView("results") && <ResultsPanel token={token} />}
          {tab === "requests" && canView("requests") && <AdminRequestsPanel token={token} />}
          {tab === "admins" && canView("admins") && <AdminUsersPanel token={token} />}
          {tab === "logs" && canView("logs") && <AdminLogsPanel token={token} />}
        </Suspense>
      </div>
    </div>
  );
}
