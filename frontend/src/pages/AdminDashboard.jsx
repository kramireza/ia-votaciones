import React, {
  useState,
  Suspense,
  useEffect
} from "react";
import {
  useNavigate
} from "react-router-dom";
import {
  getRoleFromToken
} from "../services/auth";

// PANELS
const ElectionsPanel = React.lazy(() =>
  import("../admin/ElectionsPanel")
);
const VotesPanel = React.lazy(() =>
  import("../admin/VotesPanel")
);
const StudentsPanel = React.lazy(() =>
  import("../admin/StudentsPanel")
);
const ResultsPanel = React.lazy(() =>
  import("../admin/ResultsPanel.jsx")
);
const FraudPanel = React.lazy(() =>
  import("../admin/FraudPanel.jsx")
);
const AdminUsersPanel = React.lazy(() =>
  import("../admin/AdminUsersPanel.jsx")
);
const AdminLogsPanel = React.lazy(() =>
  import("../admin/AdminLogPanel.jsx")
);
const AdminRequestsPanel = React.lazy(() =>
  import("../admin/AdminRequestsPanel.jsx")
);

export default function AdminDashboard({
  token,
  onLogout
}) {
  const [tab, setTab] =
    useState("elections");

  const [mobileMenu, setMobileMenu] =
    useState(false);

  const [now, setNow] =
    useState(new Date());

  const navigate =
    useNavigate();

  const role =
    getRoleFromToken(token);

  const editorAllowedTabs = [
    "elections",
    "students",
    "results",
    "requests"
  ];

  useEffect(() => {
    if (
      role === "editor" &&
      !editorAllowedTabs.includes(tab)
    ) {
      setTab("elections");
    }

    if (!token) {
      navigate("/admin/login");
    }
  }, [
    role,
    token,
    tab,
    navigate
  ]);

  useEffect(() => {
    const timer =
      setInterval(
        () =>
          setNow(
            new Date()
          ),
        1000
      );

    return () =>
      clearInterval(timer);
  }, []);

  function logout() {
    onLogout();
    navigate("/admin/login");
  }

  function canView(t) {
    if (role === "editor") {
      return editorAllowedTabs.includes(
        t
      );
    }

    return true;
  }

  const labels = {
    elections:
      "Gestión de Elecciones",
    votes:
      "Gestión de Votos",
    students:
      "Gestión de Estudiantes",
    results:
      "Resultados Generales",
    fraud: 
      "Detección de Fraude",
    requests:
      "Solicitudes",
    admins:
      "Administradores",
    logs:
      "Logs del Sistema"
  };

  function menuButton(
    key,
    label,
    icon
  ) {
    const active =
      tab === key;

    return (
      <button
        key={key}
        onClick={() => {
          setTab(key);
          setMobileMenu(false);
        }}
        className={`w-full text-left px-4 py-3 rounded-2xl transition-all duration-300 flex items-center gap-3 ${
          active
            ? "bg-white text-indigo-700 shadow-lg font-semibold scale-[1.02]"
            : "text-white hover:bg-white/10 hover:translate-x-1"
        }`}
      >
        <span className="text-lg">
          {icon}
        </span>

        <span>{label}</span>
      </button>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="grid lg:grid-cols-[290px_1fr] gap-6">

        {/* MOBILE MENU */}
        <div className="lg:hidden">
          <button
            onClick={() =>
              setMobileMenu(
                !mobileMenu
              )
            }
            className="w-full rounded-2xl bg-indigo-600 text-white px-4 py-3 shadow-xl font-semibold"
          >
            ☰ Menú Admin
          </button>
        </div>

        {/* SIDEBAR */}
        <aside
          className={`${
            mobileMenu
              ? "block"
              : "hidden"
          } lg:block`}
        >
          <div className="sticky top-6 rounded-3xl bg-gradient-to-b from-indigo-700 to-blue-700 text-white shadow-2xl p-5">

            {/* BRAND */}
            <div className="pb-5 border-b border-white/20">

              <div className="w-14 h-14 rounded-2xl bg-white text-indigo-700 grid place-items-center text-2xl font-black shadow-lg">
                ⚙️
              </div>

              <h2 className="text-3xl font-black mt-4">
                Panel Admin
              </h2>

              <p className="text-indigo-100 text-sm mt-1">
                Gestión del sistema
              </p>

              <div className="mt-3 inline-flex px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold">
                Rol:{" "}
                {role ===
                "superadmin"
                  ? "Superadmin"
                  : "Editor"}
              </div>
            </div>

            {/* MENU */}
            <div className="space-y-2 mt-5">

              {canView(
                "elections"
              ) &&
                menuButton(
                  "elections",
                  "Elecciones",
                  "🗳️"
                )}

              {canView(
                "votes"
              ) &&
                menuButton(
                  "votes",
                  "Votos",
                  "📊"
                )}

              {canView(
                "students"
              ) &&
                menuButton(
                  "students",
                  "Estudiantes",
                  "🎓"
                )}

              {canView(
                "results"
              ) &&
                menuButton(
                  "results",
                  "Resultados",
                  "📈"
                )}

              {canView("logs") &&
                menuButton("fraud", "Fraude", "🚨")}

              {canView(
                "requests"
              ) &&
                menuButton(
                  "requests",
                  "Solicitudes",
                  "📬"
                )}

              {canView(
                "admins"
              ) &&
                menuButton(
                  "admins",
                  "Administradores",
                  "👤"
                )}

              {canView(
                "logs"
              ) &&
                menuButton(
                  "logs",
                  "Logs",
                  "📝"
                )}

            </div>

            {/* LOGOUT */}
            <div className="mt-8 pt-5 border-t border-white/20">
              <button
                onClick={logout}
                className="w-full bg-red-500 hover:bg-red-600 px-4 py-3 rounded-2xl shadow-lg font-bold transition"
              >
                Cerrar sesión
              </button>
            </div>

          </div>
        </aside>

        {/* MAIN */}
        <section className="min-w-0 space-y-6">

          {/* TOPBAR */}
          <div className="rounded-3xl border shadow-xl p-5 bg-white dark:bg-slate-900 dark:border-slate-800">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Módulo actual
                </div>

                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                  {
                    labels[
                      tab
                    ]
                  }
                </h1>
              </div>

              <div className="flex flex-wrap gap-3 items-center">

                <div className="px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
                  ● Sistema Activo
                </div>

                <div className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 text-sm font-semibold dark:bg-slate-800 dark:text-slate-300">
                  {now.toLocaleDateString()}
                </div>

                <div className="px-4 py-2 rounded-2xl bg-indigo-600 text-white text-sm font-bold">
                  {now.toLocaleTimeString()}
                </div>

              </div>

            </div>
          </div>

          {/* CONTENT */}
          <div className="rounded-3xl border shadow-xl p-4 md:p-6 bg-white dark:bg-slate-900 dark:border-slate-800">

            <Suspense
              fallback={
                <div className="py-20 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full border-b-4 border-indigo-600 animate-spin"></div>

                  <p className="mt-4 text-slate-500 dark:text-slate-400">
                    Cargando módulo...
                  </p>
                </div>
              }
            >
              {tab ===
                "elections" &&
                canView(
                  "elections"
                ) && (
                  <ElectionsPanel
                    token={
                      token
                    }
                  />
                )}

              {tab ===
                "votes" &&
                canView(
                  "votes"
                ) && (
                  <VotesPanel
                    token={
                      token
                    }
                  />
                )}

              {tab ===
                "students" &&
                canView(
                  "students"
                ) && (
                  <StudentsPanel
                    token={
                      token
                    }
                  />
                )}

              {tab ===
                "results" &&
                canView(
                  "results"
                ) && (
                  <ResultsPanel
                    token={
                      token
                    }
                  />
                )}

              {tab === "fraud" && canView("logs") && (
                <FraudPanel token={token} />
              )}

              {tab ===
                "requests" &&
                canView(
                  "requests"
                ) && (
                  <AdminRequestsPanel
                    token={
                      token
                    }
                  />
                )}

              {tab ===
                "admins" &&
                canView(
                  "admins"
                ) && (
                  <AdminUsersPanel
                    token={
                      token
                    }
                  />
                )}

              {tab ===
                "logs" &&
                canView(
                  "logs"
                ) && (
                  <AdminLogsPanel
                    token={
                      token
                    }
                  />
                )}

            </Suspense>

          </div>

        </section>

      </div>
    </div>
  );
}