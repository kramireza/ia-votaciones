import React, { useState } from "react";
import StudentVerify from "./StudentVerify";
import AdminLogin from "./AdminLogin";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

/* ==========================================================
   ACCESO ADMIN OCULTO - 5 CLICKS
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
    <button onClick={handleClick} className="text-left">
      <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-lg">
        Sistema de Votaciones
      </h1>

      <p className="text-lg text-indigo-100 mt-2">
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
      <section className="rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-700 text-white p-8 md:p-12">

        <div className="grid lg:grid-cols-2 gap-8 items-center">

          {/* LEFT */}
          <div>
            <SecretAdminTrigger
              onUnlock={() => setShowAdmin(true)}
            />

            <p className="mt-5 text-slate-200 text-lg max-w-xl leading-relaxed">
              Plataforma oficial para procesos electorales
              estudiantiles. Participa de forma segura,
              rápida y transparente.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">

              <button
                onClick={() => navigate("/resultados")}
                className="px-6 py-3 bg-white text-indigo-700 rounded-xl font-semibold shadow-lg hover:scale-105 transition"
              >
                📊 Ver Resultados Públicos
              </button>

              <div className="px-5 py-3 bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm">
                🔒 Voto seguro
              </div>

            </div>
          </div>

          {/* RIGHT STATS */}
          <div className="grid grid-cols-2 gap-4">

            <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-md border border-white/10">
              <div className="text-sm text-slate-200">
                Proceso
              </div>
              <div className="text-2xl font-bold mt-1">
                Transparente
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-md border border-white/10">
              <div className="text-sm text-slate-200">
                Acceso
              </div>
              <div className="text-2xl font-bold mt-1">
                24/7
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-md border border-white/10">
              <div className="text-sm text-slate-200">
                Seguridad
              </div>
              <div className="text-2xl font-bold mt-1">
                Verificada
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-md border border-white/10">
              <div className="text-sm text-slate-200">
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

        {/* VERIFICACIÓN */}
        <div>
          <StudentVerify
            onVerified={handleStudentVerified}
          />
        </div>

        {/* PANEL LATERAL */}
        <div className="space-y-6">

          {/* INSTRUCCIONES */}
          <div className="bg-white rounded-3xl shadow-lg border p-6">

            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Instrucciones rápidas
            </h2>

            <div className="space-y-4">

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white grid place-items-center font-bold">
                  1
                </div>
                <div>
                  <div className="font-semibold">
                    Ingresa tu cuenta
                  </div>
                  <div className="text-sm text-slate-500">
                    Escribe tu número de cuenta institucional.
                  </div>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white grid place-items-center font-bold">
                  2
                </div>
                <div>
                  <div className="font-semibold">
                    Selecciona tu centro
                  </div>
                  <div className="text-sm text-slate-500">
                    Elige VS, CU, Danlí u otro.
                  </div>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white grid place-items-center font-bold">
                  3
                </div>
                <div>
                  <div className="font-semibold">
                    Verifica tus datos
                  </div>
                  <div className="text-sm text-slate-500">
                    El sistema validará tu elegibilidad.
                  </div>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white grid place-items-center font-bold">
                  4
                </div>
                <div>
                  <div className="font-semibold">
                    Emite tu voto
                  </div>
                  <div className="text-sm text-slate-500">
                    Participa de manera segura y confidencial.
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* LOGIN ADMIN */}
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