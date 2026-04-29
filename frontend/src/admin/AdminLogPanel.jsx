import React, {
  useEffect,
  useMemo,
  useState
} from "react";
import api from "../services/api";

export default function AdminLogsPanel({
  token
}) {
  const [logs, setLogs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [msg, setMsg] =
    useState(null);

  const [page, setPage] =
    useState(1);

  const perPage = 10;

  useEffect(() => {
    loadLogs();
  }, [token]);

  async function loadLogs() {
    try {
      setLoading(true);
      setMsg(null);

      const res =
        await api.getLogs(
          token
        );

      setLogs(
        Array.isArray(
          res.data
        )
          ? res.data
          : []
      );

    } catch {
      setMsg({
        type: "error",
        text:
          "No se pudieron cargar los logs."
      });

    } finally {
      setLoading(false);
    }
  }

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        logs.length /
          perPage
      )
    );

  const paginatedLogs =
    useMemo(() => {
      const start =
        (page - 1) *
        perPage;

      return logs.slice(
        start,
        start +
          perPage
      );
    }, [logs, page]);

  useEffect(() => {
    if (
      page >
      totalPages
    ) {
      setPage(
        totalPages
      );
    }
  }, [
    totalPages,
    page
  ]);

  function actionBadge(
    action
  ) {
    const text =
      (
        action || ""
      ).toLowerCase();

    if (
      text.includes(
        "delete"
      ) ||
      text.includes(
        "eliminar"
      )
    ) {
      return "bg-red-100 text-red-700";
    }

    if (
      text.includes(
        "create"
      ) ||
      text.includes(
        "crear"
      )
    ) {
      return "bg-emerald-100 text-emerald-700";
    }

    if (
      text.includes(
        "edit"
      ) ||
      text.includes(
        "update"
      ) ||
      text.includes(
        "editar"
      )
    ) {
      return "bg-amber-100 text-amber-700";
    }

    return "bg-indigo-100 text-indigo-700";
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 shadow-xl">

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold mb-4">
          📝 Auditoría del sistema
        </div>

        <h2 className="text-3xl font-black">
          Registro de Actividad
        </h2>

        <p className="text-slate-300 mt-2">
          Historial administrativo y eventos importantes del sistema.
        </p>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-4">

        <div className="rounded-2xl bg-white border shadow p-5">
          <div className="text-sm text-slate-500">
            Total logs
          </div>

          <div className="text-3xl font-black mt-1">
            {logs.length}
          </div>
        </div>

        <div className="rounded-2xl bg-white border shadow p-5">
          <div className="text-sm text-slate-500">
            Página actual
          </div>

          <div className="text-3xl font-black mt-1">
            {page}
          </div>
        </div>

        <div className="rounded-2xl bg-white border shadow p-5">
          <div className="text-sm text-slate-500">
            Total páginas
          </div>

          <div className="text-3xl font-black mt-1">
            {totalPages}
          </div>
        </div>

      </div>

      {/* TABLE */}
      <div className="rounded-3xl bg-white border shadow-xl overflow-hidden">

        <div className="p-5 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h3 className="text-xl font-bold text-slate-900">
            Logs recientes
          </h3>

          <button
            onClick={
              loadLogs
            }
            className="px-4 py-2 rounded-xl border font-semibold hover:bg-slate-50 transition"
          >
            🔄 Recargar
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <div className="w-10 h-10 mx-auto rounded-full border-b-4 border-slate-800 animate-spin"></div>

            <p className="mt-4 text-slate-500">
              Cargando logs...
            </p>
          </div>
        ) : logs.length ===
          0 ? (
          <div className="p-10 text-center text-slate-500">
            No hay registros disponibles.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[980px] text-sm">

              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-left">
                    Fecha
                  </th>

                  <th className="p-4 text-left">
                    Admin
                  </th>

                  <th className="p-4 text-left">
                    Acción
                  </th>

                  <th className="p-4 text-left">
                    Detalles
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedLogs.map(
                  (
                    l,
                    i
                  ) => (
                    <tr
                      key={
                        l.id
                      }
                      className={`border-t hover:bg-slate-50 transition ${
                        i % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50/50"
                      }`}
                    >
                      <td className="p-4 whitespace-nowrap">
                        {new Date(
                          l.createdAt
                        ).toLocaleString()}
                      </td>

                      <td className="p-4 font-semibold text-slate-800">
                        {
                          l.adminUsername
                        }
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${actionBadge(
                            l.action
                          )}`}
                        >
                          {
                            l.action
                          }
                        </span>
                      </td>

                      <td className="p-4 text-slate-600">
                        {
                          l.details
                        }
                      </td>
                    </tr>
                  )
                )}
              </tbody>

            </table>
          </div>
        )}

        {/* PAGINATION */}
        {!loading &&
          logs.length >
            0 && (
            <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">

              <div className="text-sm text-slate-500">
                Mostrando{" "}
                {
                  paginatedLogs.length
                }{" "}
                de{" "}
                {
                  logs.length
                }{" "}
                registros
              </div>

              <div className="flex gap-2">

                <button
                  onClick={() =>
                    setPage(
                      (
                        p
                      ) =>
                        Math.max(
                          1,
                          p -
                            1
                        )
                    )
                  }
                  disabled={
                    page ===
                    1
                  }
                  className="px-4 py-2 rounded-xl border font-semibold disabled:opacity-50"
                >
                  ← Anterior
                </button>

                <button
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold"
                >
                  {page}
                </button>

                <button
                  onClick={() =>
                    setPage(
                      (
                        p
                      ) =>
                        Math.min(
                          totalPages,
                          p +
                            1
                        )
                    )
                  }
                  disabled={
                    page ===
                    totalPages
                  }
                  className="px-4 py-2 rounded-xl border font-semibold disabled:opacity-50"
                >
                  Siguiente →
                </button>

              </div>

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