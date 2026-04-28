import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function PublicResults() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());

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
  // AUTO REFRESH
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
  // RANKING
  // ==========================================================
  const ranked = useMemo(() => {
    if (!data?.options) return [];

    return [...data.options].sort((a, b) => b.votes - a.votes);
  }, [data]);

  const leader = ranked[0];

  // ==========================================================
  // LOADING
  // ==========================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================
  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center">
          <h2 className="text-3xl font-bold text-indigo-700 mb-3">
            Resultados Públicos
          </h2>

          <p className="text-red-600 mb-6">{error}</p>

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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 p-4 md:p-8">

      {/* CONFETI VISUAL */}
      {leader && leader.votes > 0 && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-20">
          <div className="absolute top-0 left-10 text-4xl animate-bounce">🎉</div>
          <div className="absolute top-10 right-10 text-5xl animate-pulse">✨</div>
          <div className="absolute top-20 left-1/2 text-4xl animate-bounce">🏆</div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-white/60">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <button
                onClick={() => navigate("/")}
                className="mb-3 inline-flex items-center gap-2 text-indigo-700 font-medium hover:underline"
              >
                ← Volver a verificación
              </button>

              <h1 className="text-3xl md:text-4xl font-black text-slate-800">
                Dashboard Electoral
              </h1>

              <p className="text-gray-500 mt-1">
                Resultados públicos en tiempo real
              </p>
            </div>

            <div className="text-sm text-right text-gray-600">
              <div>{now.toLocaleDateString()}</div>
              <div className="text-xl font-bold text-slate-800">
                {now.toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-4">

            <div className="rounded-2xl bg-indigo-600 text-white p-5 shadow-lg">
              <div className="text-sm opacity-80">
                Elección activa
              </div>
              <div className="text-xl font-bold mt-1">
                {data.title}
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-600 text-white p-5 shadow-lg">
              <div className="text-sm opacity-80">
                Total votos
              </div>
              <div className="text-3xl font-black mt-1">
                {data.totalVotes}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-800 text-white p-5 shadow-lg">
              <div className="text-sm opacity-80">
                Última actualización
              </div>
              <div className="text-lg font-bold mt-1">
                {new Date(data.updatedAt).toLocaleTimeString()}
              </div>
            </div>

          </div>
        </div>

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
                <div className="text-sm font-semibold uppercase">
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
                      ? (
                          (leader.votes / data.totalVotes) *
                          100
                        ).toFixed(1)
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
                ? (
                    (opt.votes / data.totalVotes) *
                    100
                  ).toFixed(1)
                : "0.0";

            const medals = ["🥇", "🥈", "🥉"];

            return (
              <div
                key={index}
                className="bg-white rounded-3xl shadow-lg p-5 border hover:shadow-2xl transition"
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
                        <div className="text-sm text-gray-500">
                          {medals[index] || `#${index + 1}`}
                        </div>

                        <div className="text-xl font-bold text-slate-800">
                          {opt.text}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-indigo-700">
                          {percent}%
                        </div>
                        <div className="text-sm text-gray-500">
                          {opt.votes} votos
                        </div>
                      </div>
                    </div>

                    {/* BARRA */}
                    <div className="mt-4 h-4 bg-slate-200 rounded-full overflow-hidden">
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