import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from "chart.js";

import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

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
  // LOAD
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

  useEffect(() => {
    loadResults();

    const interval = setInterval(loadResults, 10000);
    const clock = setInterval(() => setNow(new Date()), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(clock);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("results_dark", darkMode);
  }, [darkMode]);

  // ==========================================================
  // THEME
  // ==========================================================
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

  if (!data) return null;

  const type = data.type || "simple";

  // ==========================================================
  // SIMPLE RANKING
  // ==========================================================
  const ranked =
    type === "simple"
      ? [...(data.options || [])].sort(
          (a, b) => b.votes - a.votes
        )
      : [];

  const leader = ranked[0];

  // ==========================================================
  // SIMPLE CHARTS
  // ==========================================================
  const voteChartData =
    type === "simple"
      ? {
          labels: ranked.map((item) => item.text),
          datasets: [
            {
              data: ranked.map((item) => item.votes),
              backgroundColor: [
                "#4f46e5",
                "#06b6d4",
                "#10b981",
                "#f59e0b",
                "#ef4444",
                "#8b5cf6"
              ],
              borderWidth: 2
            }
          ]
        }
      : null;

  const centerChartData = {
    labels: Object.keys(data.centerStats || {}),
    datasets: [
      {
        label: "Votos",
        data: Object.values(data.centerStats || {}),
        backgroundColor: [
          "#4f46e5",
          "#06b6d4",
          "#10b981",
          "#f59e0b"
        ],
        borderRadius: 8
      }
    ]
  };

  // ==========================================================
  // MAIN
  // ==========================================================
  return (
    <div className={`min-h-screen p-4 md:p-8 transition-all duration-500 ${theme.bg}`}>
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

              <h1 className="text-4xl md:text-5xl font-black tracking-tight">
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

        {/* CENTROS */}
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

        {/* ====================================================== */}
        {/* SIMPLE MODE */}
        {/* ====================================================== */}
        {type === "simple" && (
          <>
            {/* WINNER */}
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

            {/* CHARTS */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className={`rounded-3xl p-6 shadow-xl border ${theme.card}`}>
                <h3 className="text-xl font-bold mb-4">
                  Distribución de votos
                </h3>

                <div className="max-w-sm mx-auto">
                  <Doughnut data={voteChartData} />
                </div>
              </div>

              <div className={`rounded-3xl p-6 shadow-xl border ${theme.card}`}>
                <h3 className="text-xl font-bold mb-4">
                  Participación por centro
                </h3>

                <Bar
                  data={centerChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false }
                    }
                  }}
                />
              </div>
            </div>

            {/* LEADER */}
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
                    className={`rounded-3xl shadow-lg p-5 border ${theme.card}`}
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
                        <div className="flex justify-between gap-3">
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
          </>
        )}

        {/* ====================================================== */}
        {/* COMPOUND MODE */}
        {/* ====================================================== */}
        {type === "compound" && (
          <div className="space-y-8">
            {(data.sections || []).map((section, index) => {
              const rankedSection = [...section.options].sort(
                (a, b) => b.votes - a.votes
              );

              const winner = rankedSection[0];

              const chartData = {
                labels: rankedSection.map((o) => o.text),
                datasets: [
                  {
                    data: rankedSection.map((o) => o.votes),
                    backgroundColor: [
                      "#4f46e5",
                      "#06b6d4",
                      "#10b981",
                      "#f59e0b",
                      "#ef4444",
                      "#8b5cf6"
                    ]
                  }
                ]
              };

              return (
                <div
                  key={index}
                  className={`rounded-3xl shadow-xl border p-6 ${theme.card}`}
                >
                  <div className="flex flex-col lg:flex-row gap-6">

                    {/* LEFT */}
                    <div className="flex-1">
                      <h2 className="text-2xl font-black text-indigo-500">
                        {section.title}
                      </h2>

                      {winner && (
                        <div className="mt-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 p-4 text-slate-900">
                          <div className="text-sm uppercase font-semibold">
                            Liderando
                          </div>

                          <div className="text-2xl font-black">
                            🏆 {winner.text}
                          </div>

                          <div>
                            {winner.votes} votos
                          </div>
                        </div>
                      )}

                      <div className="mt-5 space-y-3">
                        {rankedSection.map((opt, i) => {
                          const percent =
                            data.totalVotes > 0
                              ? ((opt.votes / data.totalVotes) * 100).toFixed(1)
                              : "0.0";

                          return (
                            <div
                              key={i}
                              className={`rounded-2xl border p-4 ${theme.soft}`}
                            >
                              <div className="flex justify-between gap-3">
                                <div className="font-semibold">
                                  {opt.text}
                                </div>

                                <div className="text-right">
                                  <div className="font-black text-indigo-500">
                                    {percent}%
                                  </div>

                                  <div className={`text-sm ${theme.text}`}>
                                    {opt.votes} votos
                                  </div>
                                </div>
                              </div>

                              <div className={`mt-3 h-3 rounded-full overflow-hidden ${theme.bar}`}>
                                <div
                                  className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
                                  style={{
                                    width: `${percent}%`,
                                    transition: "width 1s ease"
                                  }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div className="lg:w-80">
                      <Doughnut data={chartData} />
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}