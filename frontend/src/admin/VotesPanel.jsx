import React, {
  useState,
  useEffect
} from "react";
import api from "../services/api";

export default function VotesPanel({
  token
}) {
  const [elections, setElections] =
    useState([]);

  const [msg, setMsg] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [deletingId, setDeletingId] =
    useState(null);

  useEffect(() => {
    loadData();
  }, [token]);

  async function loadData() {
    try {
      setLoading(true);

      const res =
        await api.getElections(
          token
        );

      setElections(
        Array.isArray(
          res.data
        )
          ? res.data
          : []
      );

    } catch (err) {
      console.error(
        "Error cargando elecciones:",
        err
      );

      setMsg({
        type: "error",
        text:
          "No se pudieron cargar las elecciones."
      });

    } finally {
      setLoading(false);
    }
  }

  async function deleteVotes(
    pollId
  ) {
    const ok = confirm(
      "¿Seguro que deseas eliminar todos los votos de esta elección?"
    );

    if (!ok) return;

    try {
      setDeletingId(
        pollId
      );
      setMsg(null);

      await api.deleteVotes(
        pollId,
        token
      );

      setMsg({
        type: "success",
        text:
          "Votos eliminados correctamente."
      });

      await loadData();

    } catch {
      setMsg({
        type: "error",
        text:
          "Error borrando votos."
      });

    } finally {
      setDeletingId(
        null
      );
    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="rounded-3xl bg-gradient-to-r from-rose-600 to-red-600 text-white p-6 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold mb-4">
          ⚠ Acción sensible
        </div>

        <h2 className="text-3xl font-black">
          Gestión de Votos
        </h2>

        <p className="text-rose-100 mt-2">
          Elimina votos registrados por elección cuando sea necesario.
        </p>
      </div>

      {/* TABLE */}
      <div className="rounded-3xl bg-white border shadow-xl overflow-hidden">

        <div className="p-5 border-b">
          <h3 className="text-lg font-bold text-slate-900">
            Elecciones disponibles
          </h3>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <div className="w-10 h-10 mx-auto rounded-full border-b-4 border-red-600 animate-spin"></div>

            <p className="mt-4 text-slate-500">
              Cargando elecciones...
            </p>
          </div>
        ) : elections.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No hay elecciones registradas.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[760px] text-sm">

              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-left font-bold">
                    Poll ID
                  </th>

                  <th className="p-4 text-left font-bold">
                    Título
                  </th>

                  <th className="p-4 text-left font-bold">
                    Estado
                  </th>

                  <th className="p-4 text-left font-bold">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {elections.map(
                  (e, i) => (
                    <tr
                      key={
                        e.pollId
                      }
                      className={`border-t hover:bg-slate-50 transition ${
                        i % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50/50"
                      }`}
                    >
                      <td className="p-4 font-mono text-xs">
                        {
                          e.pollId
                        }
                      </td>

                      <td className="p-4 font-semibold text-slate-800">
                        {
                          e.title
                        }
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            e.status ===
                            "open"
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {e.status ===
                          "open"
                            ? "Activa"
                            : "Cerrada"}
                        </span>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() =>
                            deleteVotes(
                              e.pollId
                            )
                          }
                          disabled={
                            deletingId ===
                            e.pollId
                          }
                          className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold shadow hover:bg-red-700 hover:-translate-y-0.5 transition disabled:opacity-60"
                        >
                          {deletingId ===
                          e.pollId
                            ? "Borrando..."
                            : "🗑 Borrar votos"}
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>

            </table>
          </div>
        )}
      </div>

      {/* MESSAGE */}
      {msg && (
        <div
          className={`rounded-2xl px-4 py-3 border text-sm font-medium ${
            msg.type ===
            "error"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          {msg.text}
        </div>
      )}

    </div>
  );
}