import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function PublicResults() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("results_dark") === "true";
  });

  const API_BASE =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:4001";

  // ==========================================================
  // CARGAR RESULTADOS
  // ==========================================================
  async function loadResults() {
    try {
      const res = await api.getPublicResults();
      setData(res.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "No se pudieron cargar resultados."
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // AUTO REFRESH + RELOJ
  // ==========================================================
  useEffect(() => {
    loadResults();

    const interval = setInterval(loadResults, 10000);
    const clock = setInterval(() => setNow(new Date()), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(clock);
    };
  }, []);

  // ==========================================================
  // GUARDAR TEMA
  // ==========================================================
  useEffect(() => {
    localStorage.setItem("results_dark", darkMode);
  }, [darkMode]);

  // ==========================================================
  // RANKING
  // ==========================================================
  const ranked = useMemo(() => {
    if (!data?.options) return [];
    return [...data.options].sort((a, b) => b.votes - a.votes);
  }, [data]);

  const leader = ranked[0];

  const theme = darkMode
    ? {
        bg: "bg-slate-950 text-white",
        card: "bg-slate-900 border-slate-700",
        text: "text-slate-300",
        soft: "bg-slate-800",
        bar: "bg-slate-700"
      }
    : {
        bg: "bg-gradient-to-br from-slate-100 via-white to-indigo-100 text-slate-900",
        card: "bg-white border-slate-200",
        text: "text-slate-600",
        soft: "bg-slate-100",
        bar: "bg-slate-200"
      };

  // ==========================================================
  // LOADING
  // ==========================================================
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.bg}`}>
        <div className={`p-8 rounded-2xl shadow-xl ${theme.card}`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-500 mx-auto mb-4"></div>
          <p>Cargando resultados...</p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${theme.bg}`}>
        <div className={`p-8 rounded-2xl shadow-xl max-w-lg w-full text-center ${theme.card}`}>
          <h2 className="text-3xl font-bold text-indigo-600 mb-4">
            Resultados Públicos
          </h2>

          <p className="text-red-500 mb-6">{error}</p>

          <button
            onClick={() => navigate("/")}
            className="px-5 py-3 bg-indigo-600 text-white rounded-xl"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN
  // ==========================================================
  return (
    <div className={`min-h-screen p-4 md:p-8 ${theme.bg}`}>

      {/* CONFETI */}
      {leader && leader.votes > 0 && (
        <div className="pointer-events-none fixed inset-0 opacity-20 overflow-hidden">
          <div className="absolute top-5 left-10 text-4xl animate-bounce">🎉</div>
          <div className="absolute top-10 right-10 text-4xl animate-pulse">✨</div>
          <div className="absolute top-20 left-1/2 text-5xl animate-bounce">🏆</div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className={`rounded-3xl shadow-xl p-6 border ${theme.card}`}>
          <div className="flex flex-col md:flex-row justify-between gap-4">

            <div>
              <button
                onClick={() => navigate("/")}
                className="mb-3 text-indigo-500 font-semibold hover:underline"
              >
                ← Volver a verificación
              </button>

              <h1 className="text-4xl font-black">
                Dashboard Electoral PRO+
              </h1>

              <p className={theme.text}>
                Resultados públicos en tiempo real
              </p>
            </div>

            <div className="text-right">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="mb-3 px-4 py-2 rounded-xl bg-indigo-600 text-white"
              >
                {darkMode ? "☀ Claro" : "🌙 Oscuro"}
              </button>

              <div className="text-sm">
                {now.toLocaleDateString()}
              </div>

              <div className="text-xl font-bold">
                {now.toLocaleTimeString()}
              </div>
            </div>

          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-4">

            <div className="rounded-2xl bg-indigo-600 text-white p-5 shadow-lg">
              <div className="text-sm opacity-80">Elección</div>
              <div className="text-xl font-bold mt-1">
                {data.title}
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-600 text-white p-5 shadow-lg">
              <div className="text-sm opacity-80">Total votos</div>
              <div className="text-3xl font-black">
                {data.totalVotes}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-800 text-white p-5 shadow-lg">
              <div className="text-sm opacity-80">Actualizado</div>
              <div className="text-lg font-bold">
                {new Date(data.updatedAt).toLocaleTimeString()}
              </div>
            </div>

          </div>
        </div>

        {/* GANADOR OFICIAL */}
        {data.isClosed && data.winner && (
          <div className="rounded-3xl p-6 bg-gradient-to-r from-yellow-400 to-amber-500 shadow-xl text-slate-900">
            <div className="text-sm uppercase font-semibold">
              Resultado Oficial
            </div>

            <div className="text-3xl font-black mt-1">
              🏆 {data.winner.text}
            </div>

            <div className="text-lg mt-1">
              {data.winner.votes} votos
            </div>
          </div>
        )}

        {/* ESTADÍSTICAS POR CENTRO */}
        {data.centerStats && (
          <div className="grid md:grid-cols-4 gap-4">
            {Object.entries(data.centerStats).map(([key, value]) => {
              const max = Math.max(...Object.values(data.centerStats), 1);
              const width = (value / max) * 100;

              return (
                <div
                  key={key}
                  className={`rounded-2xl p-5 shadow-lg border ${theme.card}`}
                >
                  <div className={theme.text}>{key}</div>

                  <div className="text-3xl font-black mt-1">
                    {value}
                  </div>

                  <div className={`mt-3 h-3 rounded-full overflow-hidden ${theme.bar}`}>
                    <div
                      className="h-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
                      style={{
                        width: `${width}%`,
                        transition: "width 1s ease"
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LÍDER */}
        {leader && (
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-3xl shadow-xl p-6 text-slate-900">
            <div className="flex flex-col md:flex-row gap-4 items-center">

              {leader.imageUrl && (
                <img
                  src={`${API_BASE}${leader.imageUrl}`}
                  alt={leader.text}
                  className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-lg"
                />
              )}

              <div className="flex-1 text-center md:text-left">
                <div className="text-sm uppercase font-semibold">
                  Liderando la elección
                </div>

                <div className="text-3xl font-black">
                  🏆 {leader.text}
                </div>

                <div className="text-lg mt-1">
                  {leader.votes} votos
                </div>
              </div>

              <div className="w-28 h-28 rounded-full bg-white grid place-items-center shadow-xl">
                <div className="text-center">
                  <div className="text-2xl font-black text-indigo-700">
                    {data.totalVotes > 0
                      ? ((leader.votes / data.totalVotes) * 100).toFixed(1)
                      : "0"}
                    %
                  </div>

                  <div className="text-xs text-gray-500">
                    participación
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* RANKING */}
        <div className="grid lg:grid-cols-2 gap-6">
          {ranked.map((opt, index) => {
            const percent =
              data.totalVotes > 0
                ? ((opt.votes / data.totalVotes) * 100).toFixed(1)
                : "0.0";

            const medals = ["🥇", "🥈", "🥉"];

            return (
              <div
                key={index}
                className={`rounded-3xl shadow-lg p-5 border hover:shadow-2xl transition ${theme.card}`}
              >
                <div className="flex gap-4 items-center">

                  {opt.imageUrl && (
                    <img
                      src={`${API_BASE}${opt.imageUrl}`}
                      alt={opt.text}
                      className="w-24 h-24 rounded-2xl object-cover border"
                    />
                  )}

                  <div className="flex-1">

                    <div className="flex justify-between items-center gap-3">

                      <div>
                        <div className={`text-sm ${theme.text}`}>
                          {medals[index] || `#${index + 1}`}
                        </div>

                        <div className="text-xl font-bold">
                          {opt.text}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-indigo-500">
                          {percent}%
                        </div>

                        <div className={`text-sm ${theme.text}`}>
                          {opt.votes} votos
                        </div>
                      </div>

                    </div>

                    <div className={`mt-4 h-4 rounded-full overflow-hidden ${theme.bar}`}>
                      <div
                        className="h-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
                        style={{
                          width: `${percent}%`,
                          transition: "width 1s ease"
                        }}
                      ></div>
                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}