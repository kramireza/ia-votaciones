import React, {
  useEffect,
  useState,
  useCallback
} from "react";
import api from "../services/api";
import { getRoleFromToken } from "../services/auth";

export default function AdminRequestsPanel({
  token
}) {
  const [requests, setRequests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [selected, setSelected] =
    useState(null);

  const [showModal, setShowModal] =
    useState(false);

  const [titleMap, setTitleMap] =
    useState({});

  const role =
    getRoleFromToken(token);

  let username = null;

  try {
    if (token) {
      const payload = JSON.parse(
        atob(
          token.split(".")[1]
        )
      );

      username =
        payload.username ||
        payload.user ||
        payload.name ||
        payload.sub ||
        null;
    }
  } catch {
    username = null;
  }

  const fetchRequests =
    useCallback(async () => {
      try {
        setLoading(true);

        const res =
          await api.getApprovalRequests(
            token
          );

        let allRequests =
          Array.isArray(
            res.data
          )
            ? res.data
            : [];

        let map = {};

        try {
          const elect =
            await api.getElections(
              token
            );

          if (
            Array.isArray(
              elect.data
            )
          ) {
            elect.data.forEach(
              (e) => {
                map[
                  e.pollId
                ] =
                  e.title;
              }
            );
          }
        } catch {}

        setTitleMap(map);

        if (
          role ===
            "editor" &&
          username
        ) {
          allRequests =
            allRequests.filter(
              (
                r
              ) =>
                r.requestedBy ===
                username
            );
        }

        setRequests(
          allRequests
        );

      } catch (err) {
        console.error(err);

      } finally {
        setLoading(false);
      }
    }, [
      token,
      role,
      username
    ]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function openRequestModal(
    id
  ) {
    try {
      const res =
        await api.getApprovalRequest(
          id,
          token
        );

      setSelected(
        res.data
      );
      setShowModal(true);

    } catch {
      alert(
        "Error cargando solicitud"
      );
    }
  }

  async function approve(
    id
  ) {
    const comment =
      prompt(
        "Comentario (opcional) al aprobar:"
      ) || "";

    try {
      await api.approveRequest(
        id,
        token,
        comment
      );

      setShowModal(false);
      setSelected(null);
      await fetchRequests();

    } catch {
      alert(
        "Error aprobando solicitud"
      );
    }
  }

  async function rejectReq(
    id
  ) {
    const comment =
      prompt(
        "Motivo/rechazo (opcional):"
      ) || "";

    try {
      await api.rejectRequest(
        id,
        token,
        comment
      );

      setShowModal(false);
      setSelected(null);
      await fetchRequests();

    } catch {
      alert(
        "Error rechazando solicitud"
      );
    }
  }

  function getReadableType(
    t
  ) {
    if (t === "edit")
      return "Edición";

    if (t === "delete")
      return "Eliminación";

    return t;
  }

  function getRequestTitle(
    r
  ) {
    if (!r) return "";

    if (
      r.payload?.title
    )
      return r.payload.title;

    if (
      titleMap[
        r.pollId
      ]
    )
      return titleMap[
        r.pollId
      ];

    return r.pollId;
  }

  function badgeStatus(
    status
  ) {
    if (
      status ===
      "approved"
    )
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300";

    if (
      status ===
      "rejected"
    )
      return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300";

    return "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
  }

  const pendingCount =
    requests.filter(
      (r) =>
        r.status ===
        "pending"
    ).length;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold mb-4">
          🔄 Workflow de aprobación
        </div>

        <h2 className="text-3xl font-black">
          Solicitudes
        </h2>

        <p className="text-amber-100 mt-2">
          Revisa cambios propuestos y aprueba o rechaza solicitudes.
        </p>
      </div>

      {/* GRID */}
      <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">

        {/* LEFT LIST */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-xl p-5">

          <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
            Lista de solicitudes
          </h3>

          {loading ? (
            <div className="py-10 text-center">
              <div className="w-10 h-10 mx-auto rounded-full border-b-4 border-orange-600 animate-spin"></div>

              <p className="mt-4 text-slate-500 dark:text-slate-400">
                Cargando...
              </p>
            </div>
          ) : requests.length ===
            0 ? (
            <div className="text-center text-slate-500 dark:text-slate-400 py-10">
              No hay solicitudes.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(
                (
                  r
                ) => (
                  <button
                    key={
                      r.id
                    }
                    onClick={() =>
                      openRequestModal(
                        r.id
                      )
                    }
                    className="w-full text-left rounded-2xl border dark:border-slate-800 p-4 hover:shadow-lg hover:-translate-y-0.5 transition bg-white dark:bg-slate-900"
                  >
                    <div className="flex flex-wrap justify-between gap-3">

                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          #
                          {
                            r.id
                          }{" "}
                          —{" "}
                          {getReadableType(
                            r.type
                          )}
                        </div>

                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {getRequestTitle(
                            r
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Por{" "}
                          {
                            r.requestedBy
                          }
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${badgeStatus(
                            r.status
                          )}`}
                        >
                          {
                            r.status
                          }
                        </span>

                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          {new Date(
                            r.createdAt
                          ).toLocaleString()}
                        </div>
                      </div>

                    </div>
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* RIGHT SUMMARY */}
        <div className="space-y-4">

          <div className="rounded-3xl bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-xl p-5">
            <h3 className="font-bold text-lg">
              Resumen
            </h3>

            <div className="grid grid-cols-2 gap-4 mt-4">

              <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-4">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Total
                </div>

                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {
                    requests.length
                  }
                </div>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4">
                <div className="text-sm text-amber-700">
                  Pendientes
                </div>

                <div className="text-3xl font-black text-amber-700">
                  {
                    pendingCount
                  }
                </div>
              </div>

            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-xl p-5 text-sm text-slate-600 dark:text-slate-300">
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">
              Instrucciones
            </h3>

            <ul className="space-y-2">
              <li>
                • Selecciona una solicitud para ver detalles.
              </li>
              <li>
                • Solo superadmin puede aprobar o rechazar.
              </li>
              <li>
                • Toda acción queda registrada.
              </li>
            </ul>
          </div>

        </div>

      </div>

      {/* MODAL */}
      {showModal &&
        selected && (
          <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start sm:items-center p-4 overflow-auto">
            <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 max-h-[92vh] overflow-auto border dark:border-slate-800">

              <div className="flex flex-wrap justify-between gap-4 items-start">

                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    Solicitud #
                    {
                      selected.id
                    }
                  </h3>

                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    {
                      getRequestTitle(
                        selected
                      )
                    }
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${badgeStatus(
                    selected.status
                  )}`}
                >
                  {
                    selected.status
                  }
                </span>

              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-6">

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Tipo
                  </div>

                  <div className="font-bold">
                    {getReadableType(
                      selected.type
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Solicitado por
                  </div>

                  <div className="font-bold">
                    {
                      selected.requestedBy
                    }
                  </div>
                </div>

              </div>

              {selected.payload && (
                <div className="mt-6">

                  <h4 className="text-lg font-bold mb-4">
                    Datos propuestos
                  </h4>

                  <div className="rounded-2xl border p-4 mb-4">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Título
                    </div>

                    <div className="font-bold">
                      {
                        selected
                          .payload
                          .title
                      }
                    </div>
                  </div>

                  <div className="space-y-4">

                    {/* ================= SIMPLE ================= */}
                    {Array.isArray(selected.payload.options) &&
                      selected.payload.options.length > 0 && (
                        <div className="space-y-3">
                          {selected.payload.options.map((o, i) => (
                            <div
                              key={i}
                                className="rounded-2xl border p-4"
                            >
                              <div className="flex gap-4 items-start">

                                {o.imageUrl && (
                                  <img
                                    src={o.imageUrl}
                                    alt=""
                                    className="w-24 h-24 rounded-xl object-cover border"
                                  />
                                )}

                                <div>
                                  <div className="font-bold">
                                    {o.text}
                                  </div>

                                  {o.description && (
                                    <div className="text-sm text-slate-500 mt-1">
                                      {o.description}
                                    </div>
                                  )}
                                </div>

                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    {/* ================= COMPOUND ================= */}
                    {Array.isArray(selected.payload.sections) &&
                      selected.payload.sections.length > 0 && (
                        <div className="space-y-5">

                          {selected.payload.sections.map((sec, i) => (
                            <div
                            key={i}
                              className="rounded-2xl border p-4"
                            >

                              <div className="font-bold mb-3">
                                {sec.title}
                              </div>

                              <div className="space-y-3">
                                {sec.options.map((o, j) => (
                                  <div
                                    key={j}
                                    className="rounded-xl border p-3"
                                  >
                                    <div className="flex gap-4 items-start">

                                      {o.imageUrl && (
                                        <img
                                        src={o.imageUrl}
                                          alt=""
                                          className="w-20 h-20 rounded-lg object-cover border"
                                        />
                                      )}

                                      <div>
                                        <div className="font-semibold">
                                          {o.text}
                                        </div>

                                        {o.description && (
                                          <div className="text-sm text-slate-500 mt-1">
                                            {o.description}
                                          </div>
                                        )}
                                      </div>

                                    </div>
                                  </div>
                                ))}
                              </div>

                            </div>
                          ))}

                        </div>
                    )}

                    {/* ================= FALLBACK ================= */}
                    {!selected.payload.options &&
                      !selected.payload.sections && (
                        <div className="text-slate-500">
                          No hay opciones.
                        </div>
                    )}

                  </div>

                </div>
              )}

              {selected.adminComment && (
                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Comentario admin
                  </div>

                  <div className="font-medium">
                    {
                      selected.adminComment
                    }
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-6">

                {selected.status ===
                  "pending" &&
                  role ===
                    "superadmin" && (
                    <>
                      <button
                        onClick={() =>
                          approve(
                            selected.id
                          )
                        }
                        className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-bold shadow hover:bg-emerald-700 transition"
                      >
                        ✅ Aprobar
                      </button>

                      <button
                        onClick={() =>
                          rejectReq(
                            selected.id
                          )
                        }
                        className="px-5 py-3 rounded-xl bg-red-600 text-white font-bold shadow hover:bg-red-700 transition"
                      >
                        ❌ Rechazar
                      </button>
                    </>
                  )}

                <button
                  onClick={() => {
                    setShowModal(
                      false
                    );
                    setSelected(
                      null
                    );
                  }}
                  className="px-5 py-3 rounded-xl border font-semibold"
                >
                  Cerrar
                </button>

              </div>

            </div>
          </div>
        )}

    </div>
  );
}