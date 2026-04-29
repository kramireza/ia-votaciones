import React, { useState } from "react";
import StudentVerify from "./StudentVerify";
import AdminLogin from "./AdminLogin";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

/* ==========================================================
   ACCESO ADMIN OCULTO POR CLICKS
   5 clicks sobre el título principal
========================================================== */
function SecretAdminTrigger({ onUnlock }) {
  const [clicks, setClicks] = useState(0);

  function handleClick() {
    const next = clicks + 1;
    setClicks(next);

    if (next >= 5) {
      setClicks(0);
      onUnlock();
    }

    setTimeout(() => {
      setClicks(0);
    }, 2000);
  }

  return (
    <button
      onClick={handleClick}
      className="text-left"
    >
      <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900">
        Sistema de Votaciones
      </h1>

      <p className="text-lg text-slate-600 mt-2">
        Universidad Nacional Autónoma de Honduras
      </p>
    </button>
  );
}

export default function Home({ onVerified, onAdminLogin }) {
  const [showAdmin, setShowAdmin] = useState(false);
  const navigate = useNavigate();

  function handleAdminLoginSuccess(token) {
    onAdminLogin(token);
    navigate("/admin");
  }

  async function handleStudentVerified(studentData) {
    onVerified(studentData);

    try {
      const res = await api.getActiveElection();
      const active = res.data;

      if (active) {
        navigate("/votar");
      } else {
        alert("No hay una elección activa en este momento.");
      }
    } catch (err) {
      console.error(err);
      alert("Error buscando elección activa.");
    }
  }

  return (
    <div className="space-y-8">

      {/* HERO */}
      <section className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 rounded-3xl shadow-2xl text-white p-8 md:p-12">
        <div className="grid lg:grid-cols-2 gap-8 items-center">

          <div>
            <SecretAdminTrigger
              onUnlock={() => setShowAdmin(true)}
            />

            <p className="mt-5 text-indigo-100 max-w-xl">
              Plataforma oficial para procesos electorales
              estudiantiles. Verifica tu cuenta y participa
              de forma segura, rápida y transparente.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">

              <button
                onClick={() => navigate("/resultados")}
                className="px-5 py-3 bg-white text-indigo-700 rounded-xl font-semibold shadow-lg hover:scale-105 transition"
              >
                📊 Ver Resultados Públicos
              </button>

              <div className="px-5 py-3 bg-white/10 border border-white/20 rounded-xl">
                🔒 Voto seguro
              </div>

            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
              <div className="text-sm text-indigo-100">
                Proceso
              </div>
              <div className="text-2xl font-bold mt-1">
                Transparente
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
              <div className="text-sm text-indigo-100">
                Acceso
              </div>
              <div className="text-2xl font-bold mt-1">
                24/7
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
              <div className="text-sm text-indigo-100">
                Seguridad
              </div>
              <div className="text-2xl font-bold mt-1">
                Verificada
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
              <div className="text-sm text-indigo-100">
                Resultados
              </div>
              <div className="text-2xl font-bold mt-1">
                En Vivo
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* CONTENIDO */}
      <section className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">

        {/* FORMULARIO */}
        <div>
          <StudentVerify
            onVerified={handleStudentVerified}
          />
        </div>

        {/* PANEL LATERAL */}
        <div className="space-y-6">

          <div className="bg-white rounded-3xl shadow-lg border p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Información
            </h2>

            <p className="text-slate-600 leading-relaxed">
              Los estudiantes pueden verificar su cuenta
              institucional para participar en elecciones
              activas. El proceso es rápido y confidencial.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg border p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Acceso rápido
            </h2>

            <button
              onClick={() => navigate("/resultados")}
              className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition"
            >
              Ver Dashboard Público
            </button>
          </div>

          {showAdmin && (
            <div className="bg-white rounded-3xl shadow-xl border p-6">
              <h2 className="text-xl font-bold mb-4">
                Acceso Administrador
              </h2>

              <AdminLogin
                onLogin={handleAdminLoginSuccess}
              />
            </div>
          )}

        </div>

      </section>

    </div>
  );
}