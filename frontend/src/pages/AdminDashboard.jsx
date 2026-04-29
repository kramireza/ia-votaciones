import React, { useState, Suspense, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getRoleFromToken } from "../services/auth";

// Panels
const ElectionsPanel = React.lazy(() => import("../admin/ElectionsPanel"));
const VotesPanel = React.lazy(() => import("../admin/VotesPanel"));
const StudentsPanel = React.lazy(() => import("../admin/StudentsPanel"));
const ResultsPanel = React.lazy(() => import("../admin/ResultsPanel.jsx"));
const AdminUsersPanel = React.lazy(() => import("../admin/AdminUsersPanel.jsx"));
const AdminLogsPanel = React.lazy(() => import("../admin/AdminLogPanel.jsx"));
const AdminRequestsPanel = React.lazy(() => import("../admin/AdminRequestsPanel.jsx"));

export default function AdminDashboard({ token, onLogout }) {
  const [tab, setTab] = useState("elections");
  const [mobileMenu, setMobileMenu] = useState(false);

  const navigate = useNavigate();
  const role = getRoleFromToken(token);

  const editorAllowedTabs = [
    "elections",
    "students",
    "results",
    "requests"
  ];

  useEffect(() => {
    if (role === "editor" && !editorAllowedTabs.includes(tab)) {
      setTab("elections");
    }

    if (!token) {
      navigate("/admin/login");
    }
  }, [role, token, tab, navigate]);

  function logout() {
    onLogout();
    navigate("/admin/login");
  }

  const canView = (t) => {
    if (role === "editor") {
      return editorAllowedTabs.includes(t);
    }
    return true;
  };

  const menuButton = (key, label, icon) => {
    const active = tab === key;

    return (
      <button
        key={key}
        onClick={() => {
          setTab(key);
          setMobileMenu(false);
        }}
        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3
        ${
          active
            ? "bg-white text-indigo-700 shadow-lg font-semibold"
            : "text-white hover:bg-indigo-600"
        }`}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="w-full min-h-full">

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">

        {/* MOBILE TOP BAR */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="w-full bg-indigo-700 text-white px-4 py-3 rounded-2xl shadow-lg"
          >
            ☰ Menú Admin
          </button>
        </div>

        {/* SIDEBAR */}
        <aside
          className={`
            ${mobileMenu ? "block" : "hidden"}
            lg:block
          `}
        >
          <div className="bg-indigo-700 text-white rounded-3xl shadow-2xl p-5 sticky top-6">

            <div className="mb-6 border-b border-indigo-500 pb-4">
              <h2 className="text-3xl font-bold">
                Panel Admin
              </h2>

              <p className="text-indigo-200 text-sm mt-1">
                Gestión del sistema
              </p>
            </div>

            <div className="space-y-2">

              {canView("elections") &&
                menuButton("elections", "Elecciones", "🗳")}

              {canView("votes") &&
                menuButton("votes", "Votos", "📊")}

              {canView("students") &&
                menuButton("students", "Estudiantes", "🎓")}

              {canView("results") &&
                menuButton("results", "Resultados", "📈")}

              {canView("requests") &&
                menuButton("requests", "Solicitudes", "📬")}

              {canView("admins") &&
                menuButton("admins", "Administradores", "👤")}

              {canView("logs") &&
                menuButton("logs", "Logs", "📝")}

            </div>

            <div className="mt-8 pt-5 border-t border-indigo-500">
              <button
                onClick={logout}
                className="w-full bg-red-500 hover:bg-red-600 px-4 py-3 rounded-xl shadow-lg font-semibold"
              >
                Cerrar sesión
              </button>
            </div>

          </div>
        </aside>

        {/* CONTENIDO */}
        <section className="min-w-0">

          <div className="bg-white rounded-3xl shadow-xl p-4 md:p-6">

            <Suspense
              fallback={
                <div className="py-20 text-center text-gray-500">
                  Cargando módulo...
                </div>
              }
            >
              {tab === "elections" &&
                canView("elections") &&
                <ElectionsPanel token={token} />}

              {tab === "votes" &&
                canView("votes") &&
                <VotesPanel token={token} />}

              {tab === "students" &&
                canView("students") &&
                <StudentsPanel token={token} />}

              {tab === "results" &&
                canView("results") &&
                <ResultsPanel token={token} />}

              {tab === "requests" &&
                canView("requests") &&
                <AdminRequestsPanel token={token} />}

              {tab === "admins" &&
                canView("admins") &&
                <AdminUsersPanel token={token} />}

              {tab === "logs" &&
                canView("logs") &&
                <AdminLogsPanel token={token} />}
            </Suspense>

          </div>

        </section>

      </div>

    </div>
  );
}