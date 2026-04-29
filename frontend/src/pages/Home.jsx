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
    <button
      onClick={handleClick}
      className="text-left group"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs font-semibold text-indigo-100 mb-4">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        Proceso Oficial
      </div>

      <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-lg transition group-hover:scale-[1.01]">
        Sistema de Votaciones
      </h1>

      <p className="text-lg text-indigo-100 mt-2">
        Universidad Nacional Autónoma de Honduras
      </p>
    </button>
  );
}

export default function Home({
  onVerified,
  onAdminLogin
}) {
  const [showAdmin, setShowAdmin] =
    useState(false);

  const [loadingVerify, setLoadingVerify] =
    useState(false);

  const navigate = useNavigate();

  function handleAdminLoginSuccess(
    token
  ) {
    onAdminLogin(token);
    navigate("/admin");
  }

  async function handleStudentVerified(
    studentData
  ) {
    onVerified(studentData);

    try {
      setLoadingVerify(true);

      const res =
        await api.getActiveElection();

      const active = res.data;

      if (active) {
        navigate("/votar");
      } else {
        alert(
          "No hay una elección activa en este momento."
        );
      }
    } catch (err) {
      console.error(err);
      alert(
        "Error buscando elección activa."
      );
    } finally {
      setLoadingVerify(false);
    }
  }

  return (
    <div className="space-y-8">

      {/* HERO */}
      <section className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-700 text-white p-6 md:p-12">

        <div className="absolute -top-20 -right-10 w-72 h-72 bg-cyan-400/20 blur-3xl rounded-full"></div>
        <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-fuchsia-400/20 blur-3xl rounded-full"></div>

        <div className="relative grid lg:grid-cols-2 gap-8 items-center">

          {/* LEFT */}
          <div>
            <SecretAdminTrigger
              onUnlock={() =>
                setShowAdmin(true)
              }
            />

            <p className="mt-5 text-slate-200 text-lg max-w-xl leading-relaxed">
              Plataforma oficial para procesos electorales estudiantiles.
              Participa de forma segura, rápida y transparente desde cualquier dispositivo.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">

              <button
                onClick={() =>
                  navigate(
                    "/resultados"
                  )
                }
                className="px-6 py-3 bg-white text-indigo-700 rounded-xl font-semibold shadow-lg hover:scale-105 hover:shadow-2xl transition"
              >
                📊 Ver Resultados Públicos
              </button>

              <div className="px-5 py-3 bg-white/10 border border-white/20 rounded-xl backdrop-blur-md hover:bg-white/15 transition">
                🔒 Voto seguro
              </div>

            </div>
          </div>

          {/* RIGHT */}
          <div className="grid grid-cols-2 gap-4">

            {[
              ["📌", "Proceso", "Transparente"],
              ["🕒", "Acceso", "24/7"],
              ["🛡️", "Seguridad", "Verificada"],
              ["📈", "Resultados", "En Vivo"]
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/10 rounded-2xl p-5 backdrop-blur-md border border-white/10 hover:-translate-y-1 hover:bg-white/15 transition duration-300"
              >
                <div className="text-2xl">
                  {item[0]}
                </div>

                <div className="text-sm text-slate-200 mt-2">
                  {item[1]}
                </div>

                <div className="text-2xl font-bold mt-1">
                  {item[2]}
                </div>
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* CONTENT */}
      <section className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">

        {/* VERIFY */}
        <div className="space-y-4">

          {loadingVerify && (
            <div className="rounded-2xl px-4 py-3 font-medium animate-pulse bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-300">
              Verificando elección activa...
            </div>
          )}

          <StudentVerify
            onVerified={
              handleStudentVerified
            }
          />
        </div>

        {/* SIDE */}
        <div className="space-y-6">

          {/* INSTRUCTIONS */}
          <div className="rounded-3xl shadow-lg border p-6 bg-white dark:bg-slate-900 dark:border-slate-800">

            <h2 className="text-2xl font-bold mb-5 text-slate-900 dark:text-white">
              Instrucciones rápidas
            </h2>

            <div className="space-y-4">

              {[
                [
                  "1",
                  "Ingresa tu cuenta",
                  "Escribe tu número de cuenta institucional.",
                  "bg-indigo-600"
                ],
                [
                  "2",
                  "Selecciona tu centro",
                  "Elige VS, CU, Danlí u otro.",
                  "bg-indigo-600"
                ],
                [
                  "3",
                  "Verifica tus datos",
                  "El sistema validará tu elegibilidad.",
                  "bg-indigo-600"
                ],
                [
                  "4",
                  "Emite tu voto",
                  "Participa de manera segura y confidencial.",
                  "bg-emerald-600"
                ]
              ].map((step, i) => (
                <div
                  key={i}
                  className="flex gap-4 items-start rounded-2xl p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <div
                    className={`w-9 h-9 rounded-full text-white grid place-items-center font-bold ${step[3]}`}
                  >
                    {step[0]}
                  </div>

                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {step[1]}
                    </div>

                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {step[2]}
                    </div>
                  </div>
                </div>
              ))}

            </div>
          </div>

          {/* ADMIN */}
          {showAdmin && (
            <div className="rounded-3xl shadow-xl border p-6 animate-in fade-in duration-300 bg-white dark:bg-slate-900 dark:border-slate-800">
              <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                Acceso Administrador
              </h2>

              <AdminLogin
                onLogin={
                  handleAdminLoginSuccess
                }
              />
            </div>
          )}

        </div>

      </section>
    </div>
  );
}