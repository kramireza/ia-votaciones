import React, {
  useEffect,
  useState
} from "react";
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

import {
  Doughnut,
  Bar
} from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

export default function PublicResults() {
  const navigate =
    useNavigate();

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [now, setNow] =
    useState(new Date());

  const API_BASE =
    import.meta.env.VITE_API_URL?.replace(
      "/api",
      ""
    ) ||
    "http://localhost:4001";

  async function loadResults() {
    try {
      const res =
        await api.getPublicResults();

      setData(res.data);
      setError("");

    } catch (err) {
      setError(
        err.response?.data
          ?.message ||
          "No se pudieron cargar resultados."
      );

      setData(null);

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResults();

    const interval =
      setInterval(
        loadResults,
        10000
      );

    const clock =
      setInterval(
        () =>
          setNow(
            new Date()
          ),
        1000
      );

    return () => {
      clearInterval(
        interval
      );
      clearInterval(
        clock
      );
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-3xl shadow-xl border p-8 bg-white dark:bg-slate-900 dark:border-slate-800">
          <div className="w-12 h-12 mx-auto rounded-full border-b-4 border-indigo-500 animate-spin"></div>

          <p className="mt-4 text-slate-700 dark:text-slate-300">
            Cargando resultados...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="rounded-3xl shadow-xl border p-8 w-full max-w-lg text-center bg-white dark:bg-slate-900 dark:border-slate-800">

          <h2 className="text-3xl font-black text-indigo-500">
            Resultados Públicos
          </h2>

          <p className="mt-4 text-red-500">
            {error}
          </p>

          <button
            onClick={() =>
              navigate("/")
            }
            className="mt-6 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold"
          >
            Volver
          </button>

        </div>
      </div>
    );
  }

  if (!data) return null;

  const type =
    data.type || "simple";

  const ranked =
    type === "simple"
      ? [
          ...(data.options ||
            [])
        ].sort(
          (a, b) =>
            b.votes -
            a.votes
        )
      : [];

  const voteChartData =
    type === "simple"
      ? {
          labels:
            ranked.map(
              (item) =>
                item.text
            ),
          datasets: [
            {
              data:
                ranked.map(
                  (item) =>
                    item.votes
                ),
              backgroundColor:
                [
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
    labels:
      Object.keys(
        data.centerStats ||
          {}
      ),
    datasets: [
      {
        label:
          "Votos",
        data:
          Object.values(
            data.centerStats ||
              {}
          ),
        backgroundColor:
          [
            "#4f46e5",
            "#06b6d4",
            "#10b981",
            "#f59e0b"
          ],
        borderRadius: 8
      }
    ]
  };

  return (
    <div className="min-h-screen p-4 md:p-8 transition-all duration-300">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="rounded-3xl shadow-xl border p-6 bg-white dark:bg-slate-900 dark:border-slate-800">

          <div className="flex flex-col lg:flex-row justify-between gap-6">

            <div>
              <button
                onClick={() =>
                  navigate("/")
                }
                className="text-indigo-500 font-semibold hover:underline"
              >
                ← Volver
              </button>

              <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                Dashboard Electoral
              </h1>

              <p className="text-slate-600 dark:text-slate-400">
                Resultados públicos en tiempo real
              </p>
            </div>

            <div className="text-left lg:text-right">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {now.toLocaleDateString()}
              </div>

              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {now.toLocaleTimeString()}

                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Actualización automática cada 10s
                </div>
              </div>
            </div>

          </div>

          {/* STATS */}
          <div className="grid md:grid-cols-3 gap-4 mt-6">

            <div className="rounded-2xl bg-indigo-600 text-white p-5 shadow-lg hover:-translate-y-1 transition">
              <div className="text-sm opacity-80">
                Elección
              </div>

              <div className="text-xl font-bold mt-1">
                {data.title}
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-600 text-white p-5 shadow-lg hover:-translate-y-1 transition">
              <div className="text-sm opacity-80">
                Total votos
              </div>

              <div className="text-3xl font-black">
                {data.totalVotes}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-800 text-white p-5 shadow-lg hover:-translate-y-1 transition">
              <div className="text-sm opacity-80">
                Actualizado
              </div>

              <div className="text-lg font-bold">
                {data.updatedAt
                  ? new Date(data.updatedAt).toLocaleTimeString()
                  : "Sin actualizar"}
              </div>
            </div>

          </div>
        </div>

        {/* CENTER STATS */}
        {data.centerStats && (
          <div className="grid md:grid-cols-4 gap-4">
            {Object.entries(
              data.centerStats
            ).map(
              ([
                key,
                value
              ]) => {
                const max =
                  Math.max(
                    ...Object.values(
                      data.centerStats
                    ),
                    1
                  );

                const width =
                  (value /
                    max) *
                  100;

                return (
                  <div
                    key={key}
                    className="rounded-2xl border shadow-lg p-5 hover:-translate-y-1 transition bg-white dark:bg-slate-900 dark:border-slate-800"
                  >
                    <div className="text-slate-500 dark:text-slate-400">
                      {key}
                    </div>

                    <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                      {value}
                    </div>

                    <div className="mt-3 h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                        style={{
                          width: `${width}%`
                        }}
                      ></div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}

        {/* SIMPLE */}
        {type ===
          "simple" && (
          <>
            {data.isClosed &&
              data.winner && (
                <div className="rounded-3xl bg-gradient-to-r from-yellow-400 to-amber-500 shadow-xl p-6 text-slate-900">
                  <div className="flex flex-col md:flex-row gap-5 items-center">

                    {data.winner.imageUrl && (
                      <img
                        src={`${API_BASE}${data.winner.imageUrl}`}
                        alt={
                          data.winner.text
                        }
                        className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-xl"
                      />
                    )}

                    <div className="flex-1 text-center md:text-left">
                      <div className="text-sm uppercase font-bold">
                        Resultado Oficial
                      </div>

                      <div className="text-3xl font-black">
                        🏆{" "}
                        {
                          data.winner
                            .text
                        }
                      </div>

                      <div className="text-lg mt-1">
                        {
                          data.winner
                            .votes
                        }{" "}
                        votos
                      </div>
                    </div>

                  </div>
                </div>
              )}

            <div className="grid lg:grid-cols-2 gap-6">

              <div className="rounded-3xl shadow-xl border p-6 bg-white dark:bg-slate-900 dark:border-slate-800">
                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                  Distribución de votos
                </h3>

                <div className="max-w-sm mx-auto">
                  <Doughnut
                    data={
                      voteChartData
                    }
                  />
                </div>
              </div>

              <div className="rounded-3xl shadow-xl border p-6 bg-white dark:bg-slate-900 dark:border-slate-800">
                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                  Participación por centro
                </h3>

                <Bar
                  data={
                    centerChartData
                  }
                  options={{
                    responsive: true,
                    plugins: {
                      legend:
                        {
                          display: false
                        }
                    }
                  }}
                />
              </div>

            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {ranked.map(
                (
                  opt,
                  index
                ) => {
                  const percent =
                    data.totalVotes >
                    0
                      ? (
                          (opt.votes /
                            data.totalVotes) *
                          100
                        ).toFixed(
                          1
                        )
                      : "0";

                  return (
                    <div
                      key={
                        index
                      }
                      className="rounded-3xl shadow-lg border p-5 hover:-translate-y-1 transition bg-white dark:bg-slate-900 dark:border-slate-800"
                    >
                      <div className="flex gap-4 items-center">

                        {opt.imageUrl && (
                          <img
                            src={`${API_BASE}${opt.imageUrl}`}
                            alt={
                              opt.text
                            }
                            className="w-24 h-24 rounded-2xl object-cover border dark:border-slate-700"
                          />
                        )}

                        <div className="flex-1">
                          <div className="flex justify-between gap-3">

                            <div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                #
                                {index +
                                  1}
                              </div>

                              <div className="text-xl font-bold text-slate-900 dark:text-white">
                                {
                                  opt.text
                                }
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xl font-black text-indigo-500">
                                {
                                  percent
                                }
                                %
                              </div>

                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                {
                                  opt.votes
                                }{" "}
                                votos
                              </div>
                            </div>

                          </div>

                          <div className="mt-4 h-4 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                            <div
                              className="h-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
                              style={{
                                width: `${percent}%`
                              }}
                            ></div>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}

        {/* COMPOUND */}
        {type ===
          "compound" && (
          <div className="space-y-8">
            {(
              data.sections ||
              []
            ).map(
              (
                section,
                index
              ) => {
                const rankedSection =
                  [
                    ...section.options
                  ].sort(
                    (
                      a,
                      b
                    ) =>
                      b.votes -
                      a.votes
                  );

                const winner =
                  rankedSection[0];

                const chartData =
                  {
                    labels:
                      rankedSection.map(
                        (
                          o
                        ) =>
                          o.text
                      ),
                    datasets:
                      [
                        {
                          data:
                            rankedSection.map(
                              (
                                o
                              ) =>
                                o.votes
                            ),
                          backgroundColor:
                            [
                              "#4f46e5",
                              "#06b6d4",
                              "#10b981",
                              "#f59e0b",
                              "#ef4444"
                            ]
                        }
                      ]
                  };

                return (
                  <div
                    key={
                      index
                    }
                    className="rounded-3xl shadow-xl border p-6 hover:shadow-2xl transition bg-white dark:bg-slate-900 dark:border-slate-800"
                  >
                    <div className="grid lg:grid-cols-[1fr_320px] gap-6">

                      <div>
                        <h2 className="text-2xl font-black text-indigo-500">
                          {
                            section.title
                          }
                        </h2>

                        {winner && (
                          <div className="mt-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 p-4 text-slate-900">
                            <div className="text-sm uppercase font-bold">
                              Liderando
                            </div>

                            <div className="text-2xl font-black">
                              🏆{" "}
                              {
                                winner.text
                              }
                            </div>

                            <div>
                              {
                                winner.votes
                              }{" "}
                              votos
                            </div>
                          </div>
                        )}

                        <div className="space-y-3 mt-5">
                          {rankedSection.map(
                            (
                              opt,
                              i
                            ) => {
                              const percent =
                                data.totalVotes >
                                0
                                  ? (
                                      (opt.votes /
                                        data.totalVotes) *
                                      100
                                    ).toFixed(
                                      1
                                    )
                                  : "0";

                              return (
                                <div
                                  key={
                                    i
                                  }
                                  className="rounded-2xl border p-4 bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                                >
                                  <div className="flex justify-between gap-3">

                                    <div className="flex items-center gap-3">
                                      {opt.imageUrl && (
                                        <img
                                          src={`${API_BASE}${opt.imageUrl}`}
                                          alt={
                                            opt.text
                                          }
                                          className="w-14 h-14 rounded-xl object-cover border dark:border-slate-700"
                                        />
                                      )}

                                      <div className="font-semibold text-slate-900 dark:text-white">
                                        {
                                          opt.text
                                        }
                                      </div>
                                    </div>

                                    <div className="text-right">
                                      <div className="font-black text-indigo-500">
                                        {
                                          percent
                                        }
                                        %
                                      </div>

                                      <div className="text-sm text-slate-500 dark:text-slate-400">
                                        {
                                          opt.votes
                                        }{" "}
                                        votos
                                      </div>
                                    </div>

                                  </div>

                                  <div className="mt-3 h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                                    <div
                                      className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
                                      style={{
                                        width: `${percent}%`
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-center">
                        <div className="w-full max-w-[300px]">
                          <Doughnut
                            data={
                              chartData
                            }
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}

        {/* CTA */}
        <div className="text-center pt-4">
          <button
            onClick={() =>
              navigate("/")
            }
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg hover:-translate-y-0.5 transition"
          >
            ← Volver al Inicio
          </button>
        </div>

      </div>
    </div>
  );
}