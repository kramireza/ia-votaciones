import React, {
  useState,
  useEffect,
  useRef
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function VotingPage({
  student,
  onVoted
}) {
  const navigate = useNavigate();

  const [poll, setPoll] = useState(null);
  const [selected, setSelected] = useState("");
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [backendChecked, setBackendChecked] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const sectionRefs = useRef({});

  const voteKey = poll
    ? `voted_${poll.pollId}_${student.accountNumber}`
    : null;

  const voteLocked =
    status?.type === "success" ||
    status?.type === "info";

  useEffect(() => {
    async function loadPoll() {
      try {
        const res =
          await api.getActiveElection();
        setPoll(res.data);
      } catch {
        setStatus({
          type: "error",
          text:
            "No se pudo cargar la elección activa."
        });
      }
    }

    loadPoll();
  }, []);

  useEffect(() => {
    async function validateVote() {
      if (!student || !poll) return;

      try {
        const res =
          await api.checkVote(
            poll.pollId,
            student.accountNumber
          );

        if (res.data.hasVoted) {
          setStatus({
            type: "info",
            text:
              "Ya registraste un voto para esta votación."
          });
        } else {
          localStorage.removeItem(voteKey);
        }
      } catch {}

      setBackendChecked(true);
    }

    validateVote();
  }, [poll, student]);

  useEffect(() => {
    if (!voteKey || !backendChecked)
      return;

    const voted =
      localStorage.getItem(voteKey);

    if (voted) {
      setStatus({
        type: "info",
        text:
          "Ya registraste un voto para esta votación."
      });
    }
  }, [voteKey, backendChecked]);

  useEffect(() => {
    if (
      status?.type === "success"
    ) {
      setCountdown(5);

      const timer =
        setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              onVoted?.();
              navigate("/resultados");
              return 0;
            }

            return prev - 1;
          });
        }, 1000);

      return () =>
        clearInterval(timer);
    }
  }, [status]);

  const totalSections =
    poll?.sections?.length || 0;

  const answeredSections =
    Object.keys(answers).length;

  const progress =
    totalSections > 0
      ? (answeredSections /
          totalSections) *
        100
      : 0;

  function submitVote(e) {
    e.preventDefault();

    if (voteLocked) return;

    setStatus(null);

    const type =
      poll?.type || "simple";

    if (
      type === "simple" &&
      !selected
    ) {
      setStatus({
        type: "error",
        text:
          "Selecciona una opción antes de votar."
      });
      return;
    }

    if (
      type === "compound"
    ) {
      for (const sec of poll.sections || []) {
        if (
          !answers[sec.title]
        ) {
          setStatus({
            type: "error",
            text:
              "Debes responder todas las secciones."
          });

          sectionRefs.current[
            sec.title
          ]?.scrollIntoView({
            behavior:
              "smooth",
            block: "center"
          });

          return;
        }
      }
    }

    const already =
      localStorage.getItem(
        voteKey
      );

    if (already) {
      setStatus({
        type: "error",
        text:
          "Ya has votado."
      });
      return;
    }

    setShowConfirmModal(true);
  }

  async function confirmVote() {
    if (
      !poll ||
      !student ||
      submitting ||
      voteLocked
    )
      return;

    setSubmitting(true);

    const type =
      poll.type || "simple";

    try {
      const payload = {
        studentAccount:
          student.accountNumber,
        studentName:
          student.name,
        studentCenter:
          student.center,
        pollId: poll.pollId
      };

      if (type === "simple") {
        payload.option =
          selected;
      } else {
        payload.answers =
          answers;
      }

      await api.castVote(
        payload
      );

      localStorage.setItem(
        voteKey,
        JSON.stringify({
          type,
          option:
            selected,
          answers,
          timestamp:
            new Date().toISOString()
        })
      );

      setShowConfirmModal(false);

      setStatus({
        type: "success",
        text:
          "Voto registrado correctamente. Gracias por participar."
      });
    } catch (err) {
      setShowConfirmModal(false);

      setStatus({
        type: "error",
        text:
          err.response?.data
            ?.message ||
          "Error al registrar voto."
      });
    } finally {
      setSubmitting(false);
    }
  }

  function cancelConfirmation() {
    if (submitting) return;
    setShowConfirmModal(false);
  }

  if (!poll) {
    return (
      <div className="rounded-3xl border shadow p-6 bg-white text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200">
        Cargando elección...
      </div>
    );
  }

  const type =
    poll.type || "simple";

  const API_BASE =
    import.meta.env.VITE_API_URL?.replace(
      "/api",
      ""
    ) ||
    "http://localhost:4001";

  return (
    <>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="rounded-3xl bg-gradient-to-r from-indigo-700 to-blue-600 text-white p-6 shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            🗳️ Elección activa
          </div>

          <h2 className="text-2xl md:text-4xl font-black">
            {poll.title}
          </h2>

          <p className="text-indigo-100 mt-3 text-sm md:text-base">
            Votando como{" "}
            <strong>
              {student.name}
            </strong>{" "}
            —{" "}
            {
              student.accountNumber
            }
          </p>
        </div>

        <form
          onSubmit={submitVote}
          className="space-y-6"
        >

          {/* SIMPLE */}
          {type ===
            "simple" && (
            <div className="grid gap-4">
              {(poll.options || []).map(
                (
                  opt,
                  i
                ) => {
                  const isActive =
                    selected ===
                    opt.text;

                  return (
                    <label
                      key={i}
                      className={`rounded-2xl border p-4 flex gap-4 transition-all duration-300 ${
                        isActive
                          ? "border-indigo-600 ring-2 ring-indigo-200 shadow-lg bg-indigo-50 dark:bg-indigo-500/10 dark:border-indigo-400"
                          : "bg-white hover:shadow-md hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700"
                      } ${
                        voteLocked
                          ? "opacity-70 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <input
                        type="radio"
                        disabled={
                          voteLocked
                        }
                        checked={
                          isActive
                        }
                        onChange={() =>
                          setSelected(
                            opt.text
                          )
                        }
                      />

                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-bold text-lg text-slate-900 dark:text-white">
                            {
                              opt.text
                            }
                          </div>

                          {isActive && (
                            <span className="text-green-600 font-bold">
                              ✓
                            </span>
                          )}
                        </div>

                        {opt.description && (
                          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {
                              opt.description
                            }
                          </div>
                        )}

                        {opt.imageUrl && (
                          <img
                            src={`${API_BASE}${opt.imageUrl}`}
                            className="w-full max-w-[180px] h-auto rounded-xl border object-cover mt-3 dark:border-slate-700"
                          />
                        )}
                      </div>
                    </label>
                  );
                }
              )}
            </div>
          )}

          {/* COMPOUND */}
          {type ===
            "compound" && (
            <div className="space-y-8">

              <div className="rounded-2xl border shadow p-4 bg-white dark:bg-slate-900 dark:border-slate-800">
                <div className="flex justify-between text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  <span>
                    Progreso
                  </span>

                  <span>
                    {
                      answeredSections
                    }{" "}
                    de{" "}
                    {
                      totalSections
                    }
                  </span>
                </div>

                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-3 bg-indigo-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`
                    }}
                  ></div>
                </div>
              </div>

              {(poll.sections || []).map(
                (
                  section,
                  i
                ) => (
                  <div
                    key={i}
                    ref={(
                      el
                    ) =>
                      (sectionRefs.current[
                        section.title
                      ] = el)
                    }
                    className="rounded-3xl border shadow p-5 space-y-4 bg-white dark:bg-slate-900 dark:border-slate-800"
                  >
                    <h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-400">
                      {
                        section.title
                      }
                    </h3>

                    <div className="grid gap-3">
                      {(
                        section.options ||
                        []
                      ).map(
                        (
                          opt,
                          j
                        ) => {
                          const isActive =
                            answers[
                              section.title
                            ] ===
                            opt.text;

                          return (
                            <label
                              key={j}
                              className={`rounded-2xl border p-4 flex gap-3 transition-all ${
                                isActive
                                  ? "border-indigo-600 ring-2 ring-indigo-200 bg-indigo-50 shadow dark:bg-indigo-500/10 dark:border-indigo-400"
                                  : "bg-slate-50 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-900"
                              } ${
                                voteLocked
                                  ? "opacity-70 cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                            >
                              <input
                                type="radio"
                                disabled={
                                  voteLocked
                                }
                                checked={
                                  isActive
                                }
                                onChange={() =>
                                  setAnswers(
                                    {
                                      ...answers,
                                      [section.title]:
                                        opt.text
                                    }
                                  )
                                }
                              />

                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="font-semibold text-slate-900 dark:text-white">
                                    {
                                      opt.text
                                    }
                                  </div>

                                  {isActive && (
                                    <span className="text-green-600 font-bold">
                                      ✓
                                    </span>
                                  )}
                                </div>

                                {opt.description && (
                                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {
                                      opt.description
                                    }
                                  </div>
                                )}

                                {opt.imageUrl && (
                                  <img
                                    src={`${API_BASE}${opt.imageUrl}`}
                                    className="w-full max-w-[180px] h-auto rounded-xl border object-cover mt-3 dark:border-slate-700"
                                  />
                                )}
                              </div>
                            </label>
                          );
                        }
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={
                submitting ||
                voteLocked
              }
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition disabled:opacity-60"
            >
              {submitting
                ? "Enviando..."
                : "🗳️ Votar"}
            </button>

            <button
              type="button"
              disabled={
                voteLocked
              }
              onClick={() => {
                setSelected("");
                setAnswers({});
                setStatus(
                  null
                );
              }}
              className="w-full sm:w-auto px-6 py-3 border rounded-xl font-semibold disabled:opacity-60 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
            >
              Limpiar
            </button>
          </div>

          {/* STATUS */}
          {status && (
            <div
              className={`rounded-2xl px-4 py-4 border ${
                status.type ===
                "error"
                  ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30"
                  : status.type ===
                    "success"
                  ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/30"
                  : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30"
              }`}
            >
              {status.text}
            </div>
          )}

          {/* SUCCESS TIMER */}
          {status?.type ===
            "success" && (
            <div className="rounded-2xl border shadow p-4 bg-white dark:bg-slate-900 dark:border-slate-800">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Redirigiendo en{" "}
                <strong>
                  {
                    countdown
                  }
                </strong>{" "}
                segundos...
              </p>

              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded mt-3 overflow-hidden">
                <div
                  className="bg-green-600 h-2 rounded transition-all"
                  style={{
                    width: `${
                      (countdown /
                        5) *
                      100
                    }%`
                  }}
                ></div>
              </div>
            </div>
          )}

        </form>
      </div>

      {/* MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4 overflow-auto">
          <div className="rounded-3xl shadow-2xl p-6 w-full max-w-lg my-8 bg-white dark:bg-slate-900 dark:border dark:border-slate-800">

            <div className="text-center">
              <div className="text-5xl mb-3">
                🗳️
              </div>

              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Confirmar voto
              </h3>

              <p className="text-slate-500 dark:text-slate-400 mt-2">
                Verifica tu selección antes de continuar.
              </p>
            </div>

            {type ===
              "simple" && (
              <div className="mt-5 border rounded-2xl p-4 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-semibold text-green-700 dark:text-green-300">
                {selected}
              </div>
            )}

            {type ===
              "compound" && (
              <div className="space-y-3 mt-5 max-h-[60vh] overflow-auto pr-1">
                {(poll.sections || []).map(
                  (
                    sec,
                    i
                  ) => (
                    <div
                      key={i}
                      className="border rounded-2xl p-3 bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                    >
                      <div className="font-semibold text-slate-700 dark:text-slate-300">
                        {
                          sec.title
                        }
                      </div>

                      <div className="text-green-700 dark:text-green-300 font-bold mt-1">
                        {
                          answers[
                            sec.title
                          ]
                        }
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            <p className="text-sm text-red-600 dark:text-red-400 mt-4">
              Esta acción no se puede deshacer.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">

              <button
                onClick={
                  cancelConfirmation
                }
                className="w-full sm:w-auto px-4 py-3 border rounded-xl font-semibold bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
              >
                Cancelar
              </button>

              <button
                onClick={
                  confirmVote
                }
                disabled={
                  submitting
                }
                className="w-full sm:w-auto px-4 py-3 bg-green-600 text-white rounded-xl font-bold disabled:opacity-60"
              >
                {submitting
                  ? "Confirmando..."
                  : "Confirmar voto"}
              </button>

            </div>

          </div>
        </div>
      )}
    </>
  );
}