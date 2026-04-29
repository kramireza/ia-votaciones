import React, { useEffect, useMemo, useState } from "react";
import {
  Bar
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import api from "../services/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

export default function ResultsPanel({ token }) {
  const [results, setResults] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);

  // =====================================================
  // LOAD
  // =====================================================
  async function loadResults() {
    try {
      const res = await api.getAllResults(token);
      const list = res.data || [];

      setResults(list);

      if (!selectedId && list.length > 0) {
        setSelectedId(list[0].pollId);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResults();
  }, []);

  const selected = useMemo(() => {
    return results.find(
      (r) => r.pollId === selectedId
    );
  }, [results, selectedId]);

  // =====================================================
  // HELPERS
  // =====================================================
  function percent(votes, total) {
    if (!total) return "0.0";
    return (
      (votes / total) *
      100
    ).toFixed(1);
  }

  // =====================================================
  // SIMPLE CHART
  // =====================================================
  const simpleChart = useMemo(() => {
    if (!selected) return null;

    const labels =
      selected.options?.map(
        (o) => o.text
      ) || [];

    const data =
      selected.options?.map(
        (o) => o.votes
      ) || [];

    return {
      labels,
      datasets: [
        {
          label: "Votos",
          data
        }
      ]
    };
  }, [selected]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow border">
        Cargando resultados...
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-700 to-blue-600 text-white p-6 shadow-xl">
        <h2 className="text-3xl font-black">
          Resultados Generales
        </h2>

        <p className="text-indigo-100 mt-2">
          Dashboard administrativo de resultados electorales
        </p>
      </div>

      {/* SELECTOR */}
      <div className="bg-white rounded-3xl shadow border p-6">
        <label className="block text-sm font-semibold mb-2">
          Seleccionar elección
        </label>

        <select
          className="w-full border rounded-xl px-4 py-3"
          value={selectedId}
          onChange={(e) =>
            setSelectedId(
              e.target.value
            )
          }
        >
          {results.map((r) => (
            <option
              key={r.pollId}
              value={r.pollId}
            >
              {r.title}
            </option>
          ))}
        </select>
      </div>

      {!selected && (
        <div className="bg-white rounded-3xl shadow border p-6">
          No hay resultados disponibles.
        </div>
      )}

      {selected && (
        <>
          {/* SUMMARY */}
          <div className="grid md:grid-cols-4 gap-4">

            <div className="bg-white rounded-2xl shadow border p-5">
              <div className="text-sm text-gray-500">
                ID
              </div>

              <div className="font-mono text-sm mt-1 break-all">
                {selected.pollId}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow border p-5">
              <div className="text-sm text-gray-500">
                Tipo
              </div>

              <div className="font-bold mt-1 capitalize">
                {selected.type ||
                  "simple"}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow border p-5">
              <div className="text-sm text-gray-500">
                Estado
              </div>

              <div className="mt-1">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selected.status ===
                    "open"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {selected.status ===
                  "open"
                    ? "Activa"
                    : "Cerrada"}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow border p-5">
              <div className="text-sm text-gray-500">
                Total votos
              </div>

              <div className="text-3xl font-black mt-1">
                {selected.totalVotes || 0}
              </div>
            </div>

          </div>

          {/* TITLE */}
          <div className="bg-white rounded-3xl shadow border p-6">
            <h3 className="text-2xl font-bold">
              {selected.title}
            </h3>
          </div>

          {/* ================================================= */}
          {/* SIMPLE */}
          {/* ================================================= */}
          {(selected.type ||
            "simple") ===
            "simple" && (
            <>
              {/* CHART */}
              <div className="bg-white rounded-3xl shadow border p-6">
                <h4 className="text-lg font-bold mb-4">
                  Gráfica general
                </h4>

                <Bar
                  data={simpleChart}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false
                      }
                    }
                  }}
                />
              </div>

              {/* TABLE */}
              <div className="bg-white rounded-3xl shadow border overflow-hidden">
                <div className="p-5 border-b">
                  <h4 className="text-lg font-bold">
                    Resultados detallados
                  </h4>
                </div>

                <div className="overflow-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-4 text-left">
                          Opción
                        </th>
                        <th className="p-4 text-left">
                          Votos
                        </th>
                        <th className="p-4 text-left">
                          %
                        </th>
                        <th className="p-4 text-left">
                          Barra
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {selected.options?.map(
                        (opt, i) => (
                          <tr
                            key={i}
                            className="border-t"
                          >
                            <td className="p-4 font-semibold">
                              {opt.text}
                            </td>

                            <td className="p-4">
                              {opt.votes}
                            </td>

                            <td className="p-4">
                              {percent(
                                opt.votes,
                                selected.totalVotes
                              )}
                              %
                            </td>

                            <td className="p-4 w-[320px]">
                              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-3 bg-indigo-600 rounded-full"
                                  style={{
                                    width: `${percent(
                                      opt.votes,
                                      selected.totalVotes
                                    )}%`
                                  }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ================================================= */}
          {/* COMPOUND */}
          {/* ================================================= */}
          {selected.type ===
            "compound" && (
            <div className="space-y-6">
              {selected.sections?.map(
                (section, idx) => {
                  const totalSectionVotes =
                    section.options?.reduce(
                      (
                        acc,
                        item
                      ) =>
                        acc +
                        (item.votes ||
                          0),
                      0
                    ) || 0;

                  const winner =
                    [...(section.options ||
                      [])].sort(
                      (a, b) =>
                        (b.votes ||
                          0) -
                        (a.votes ||
                          0)
                    )[0];

                  const chartData = {
                    labels:
                      section.options?.map(
                        (o) =>
                          o.text
                      ) || [],
                    datasets: [
                      {
                        label:
                          "Votos",
                        data:
                          section.options?.map(
                            (
                              o
                            ) =>
                              o.votes
                          ) || []
                      }
                    ]
                  };

                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-3xl shadow border p-6 space-y-5"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <h4 className="text-xl font-bold">
                            {
                              section.title
                            }
                          </h4>

                          <p className="text-sm text-gray-500">
                            Total votos:{" "}
                            {
                              totalSectionVotes
                            }
                          </p>
                        </div>

                        {winner && (
                          <div className="px-4 py-2 rounded-2xl bg-green-50 text-green-700 text-sm font-semibold">
                            Ganador:{" "}
                            {
                              winner.text
                            }
                          </div>
                        )}
                      </div>

                      <Bar
                        data={
                          chartData
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

                      <div className="overflow-auto">
                        <table className="w-full min-w-[700px]">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="p-4 text-left">
                                Opción
                              </th>

                              <th className="p-4 text-left">
                                Votos
                              </th>

                              <th className="p-4 text-left">
                                %
                              </th>

                              <th className="p-4 text-left">
                                Barra
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {section.options?.map(
                              (
                                opt,
                                j
                              ) => (
                                <tr
                                  key={
                                    j
                                  }
                                  className="border-t"
                                >
                                  <td className="p-4 font-semibold">
                                    {
                                      opt.text
                                    }
                                  </td>

                                  <td className="p-4">
                                    {
                                      opt.votes
                                    }
                                  </td>

                                  <td className="p-4">
                                    {percent(
                                      opt.votes,
                                      totalSectionVotes
                                    )}
                                    %
                                  </td>

                                  <td className="p-4 w-[320px]">
                                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-3 bg-indigo-600 rounded-full"
                                        style={{
                                          width: `${percent(
                                            opt.votes,
                                            totalSectionVotes
                                          )}%`
                                        }}
                                      ></div>
                                    </div>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}