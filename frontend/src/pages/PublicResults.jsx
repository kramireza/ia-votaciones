import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function PublicResults() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:4000";

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

    const interval = setInterval(() => {
      loadResults();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="card">
        <p className="text-gray-600">Cargando resultados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold mb-3">
          Resultados Públicos
        </h2>

        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="card space-y-6">
      {/* HEADER */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-indigo-700">
          Resultados Públicos
        </h1>

        <h2 className="text-xl font-semibold mt-2">
          {data.title}
        </h2>

        <p className="text-gray-600 mt-1">
          Total de votos:{" "}
          <strong>{data.totalVotes}</strong>
        </p>

        <p className="text-sm text-gray-500 mt-1">
          Última actualización:{" "}
          {new Date(data.updatedAt).toLocaleString()}
        </p>
      </div>

      {/* OPCIONES */}
      <div className="space-y-4">
        {data.options.map((opt, index) => {
          const percent =
            data.totalVotes > 0
              ? (
                  (opt.votes / data.totalVotes) *
                  100
                ).toFixed(1)
              : "0.0";

          return (
            <div
              key={index}
              className="border rounded-xl p-4 shadow-sm bg-white"
            >
              <div className="flex flex-col md:flex-row gap-4 items-center">

                {/* FOTO */}
                {opt.imageUrl && (
                  <img
                    src={`${API_BASE}${opt.imageUrl}`}
                    alt={opt.text}
                    className="w-28 h-28 rounded-lg object-cover border"
                  />
                )}

                {/* INFO */}
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-center gap-3">
                    <h3 className="text-lg font-bold">
                      {opt.text}
                    </h3>

                    <span className="text-sm text-gray-600">
                      {opt.votes} votos ({percent}%)
                    </span>
                  </div>

                  {/* BARRA */}
                  <div className="w-full h-4 bg-gray-200 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-4 bg-indigo-600 rounded-full"
                      style={{
                        width: `${percent}%`,
                        transition: "width 0.8s ease"
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
  );
}