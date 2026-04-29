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

  // SIMPLE
  const [selected, setSelected] =
    useState("");

  // COMPOUND
  const [answers, setAnswers] =
    useState({});

  const [status, setStatus] =
    useState(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [countdown, setCountdown] =
    useState(5);

  const [backendChecked, setBackendChecked] =
    useState(false);

  const [
    showConfirmModal,
    setShowConfirmModal
  ] = useState(false);

  const sectionRefs = useRef({});

  const voteKey = poll
    ? `voted_${poll.pollId}_${student.accountNumber}`
    : null;

  const voteLocked =
    status?.type === "success" ||
    status?.type === "info";

  // =====================================================
  // LOAD POLL
  // =====================================================
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

  // =====================================================
  // CHECK BACKEND
  // =====================================================
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
          localStorage.removeItem(
            voteKey
          );
        }
      } catch {}

      setBackendChecked(true);
    }

    validateVote();
  }, [poll, student]);

  // =====================================================
  // CHECK LOCAL
  // =====================================================
  useEffect(() => {
    if (
      !voteKey ||
      !backendChecked
    )
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

  // =====================================================
  // REDIRECT
  // =====================================================
  useEffect(() => {
    if (
      status?.type === "success"
    ) {
      setCountdown(5);

      const timer =
        setInterval(() => {
          setCountdown(
            (prev) => {
              if (prev <= 1) {
                clearInterval(
                  timer
                );

                onVoted?.();
                navigate(
                  "/resultados"
                );

                return 0;
              }

              return prev - 1;
            }
          );
        }, 1000);

      return () =>
        clearInterval(timer);
    }
  }, [status]);

  // =====================================================
  // PROGRESS
  // =====================================================
  const totalSections =
    poll?.sections?.length || 0;

  const answeredSections =
    Object.keys(answers).length;

  const progress =
    totalSections > 0
      ? (
          answeredSections /
          totalSections
        ) *
        100
      : 0;

  // =====================================================
  // VALIDATE
  // =====================================================
  function submitVote(e) {
    e.preventDefault();

    if (voteLocked) return;

    setStatus(null);

    const type =
      poll?.type || "simple";

    if (type === "simple") {
      if (!selected) {
        setStatus({
          type: "error",
          text:
            "Selecciona una opción antes de votar."
        });

        return;
      }
    }

    if (
      type === "compound"
    ) {
      const sections =
        poll.sections || [];

      for (const sec of sections) {
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

  // =====================================================
  // CONFIRM
  // =====================================================
  async function confirmVote() {
    if (
      !poll ||
      !student ||
      submitting ||
      voteLocked
    )
      return;

    const type =
      poll.type || "simple";

    setSubmitting(true);

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

      if (
        type === "simple"
      ) {
        payload.option =
          selected;
      }

      if (
        type ===
        "compound"
      ) {
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

      setShowConfirmModal(
        false
      );

      setStatus({
        type: "success",
        text:
          "Voto registrado correctamente. Gracias por participar."
      });

    } catch (err) {
      setShowConfirmModal(
        false
      );

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

  // =====================================================
  // LOADING
  // =====================================================
  if (!poll) {
    return (
      <div className="card">
        <p>
          Cargando elección...
        </p>
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
      <div className="card space-y-6">

        {/* HEADER */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            {poll.title}
          </h2>

          <p className="text-sm text-slate-500 mt-2">
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
              {(
                poll.options ||
                []
              ).map(
                (
                  opt,
                  index
                ) => (
                  <label
                    key={
                      index
                    }
                    className={`border rounded-2xl p-4 flex gap-4 transition ${
                      voteLocked
                        ? "opacity-70 cursor-not-allowed"
                        : "cursor-pointer hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      disabled={
                        voteLocked
                      }
                      checked={
                        selected ===
                        opt.text
                      }
                      onChange={() =>
                        setSelected(
                          opt.text
                        )
                      }
                    />

                    <div className="flex-1">
                      <div className="font-bold text-lg">
                        {
                          opt.text
                        }
                      </div>

                      {opt.description && (
                        <div className="text-sm text-slate-500">
                          {
                            opt.description
                          }
                        </div>
                      )}

                      {opt.imageUrl && (
                        <img
                          src={`${API_BASE}${opt.imageUrl}`}
                          className="w-full max-w-[160px] h-auto rounded-lg border object-cover mt-3"
                        />
                      )}
                    </div>
                  </label>
                )
              )}
            </div>
          )}

          {/* COMPOUND */}
          {type ===
            "compound" && (
            <div className="space-y-8">

              {/* PROGRESS */}
              <div className="bg-slate-50 border rounded-2xl p-4">
                <div className="flex justify-between text-sm font-medium mb-2">
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

                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-3 bg-indigo-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`
                    }}
                  ></div>
                </div>
              </div>

              {(
                poll.sections ||
                []
              ).map(
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
                    className="border rounded-2xl p-5 bg-slate-50"
                  >
                    <h3 className="text-lg md:text-xl font-bold mb-4 text-indigo-700">
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
                        ) => (
                          <label
                            key={
                              j
                            }
                            className={`border rounded-xl p-4 bg-white flex gap-3 transition ${
                              voteLocked
                                ? "opacity-70 cursor-not-allowed"
                                : "cursor-pointer hover:bg-indigo-50"
                            }`}
                          >
                            <input
                              type="radio"
                              disabled={
                                voteLocked
                              }
                              checked={
                                answers[
                                  section.title
                                ] ===
                                opt.text
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
                              <div className="font-semibold">
                                {
                                  opt.text
                                }
                              </div>

                              {opt.description && (
                                <div className="text-sm text-slate-500">
                                  {opt.description}
                                </div>
                              )}

                              {opt.imageUrl && (
                                <img
                                  src={`${API_BASE}${opt.imageUrl}`}
                                  className="w-full max-w-[160px] h-auto rounded-lg border object-cover mt-3"
                                />
                              )}
                            </div>
                          </label>
                        )
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={
                submitting ||
                voteLocked
              }
              className="w-full sm:w-auto px-5 py-3 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-60"
            >
              {submitting
                ? "Enviando..."
                : "Votar"}
            </button>

            <button
              type="button"
              disabled={
                voteLocked
              }
              onClick={() => {
                setSelected("");
                setAnswers(
                  {}
                );
                setStatus(
                  null
                );
              }}
              className="w-full sm:w-auto px-5 py-3 border rounded-xl disabled:opacity-60"
            >
              Limpiar
            </button>
          </div>

          {/* STATUS */}
          {status && (
            <div
              className={`rounded-xl px-4 py-3 ${
                status.type ===
                "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : status.type ===
                    "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {status.text}
            </div>
          )}

          {/* TIMER */}
          {status?.type ===
            "success" && (
            <div className="bg-slate-100 rounded-xl p-4 border">
              <p className="text-sm">
                Serás redirigido en{" "}
                <strong>
                  {
                    countdown
                  }
                </strong>{" "}
                segundos...
              </p>

              <div className="w-full bg-slate-300 h-2 rounded mt-3">
                <div
                  className="bg-green-600 h-2 rounded"
                  style={{
                    width: `${
                      (countdown /
                        5) *
                      100
                    }%`,
                    transition:
                      "1s linear"
                  }}
                ></div>
              </div>
            </div>
          )}

        </form>
      </div>

      {/* MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 overflow-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg my-8">

            <h3 className="text-2xl font-bold mb-4">
              Confirmar voto
            </h3>

            {type ===
              "simple" && (
              <>
                <p className="mb-2">
                  Vas a votar por:
                </p>

                <div className="border rounded-xl p-3 bg-slate-50 font-semibold text-green-700">
                  {selected}
                </div>
              </>
            )}

            {type ===
              "compound" && (
              <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
                {(
                  poll.sections ||
                  []
                ).map(
                  (
                    sec,
                    i
                  ) => (
                    <div
                      key={i}
                      className="border rounded-xl p-3 bg-slate-50"
                    >
                      <div className="font-semibold text-slate-700">
                        {
                          sec.title
                        }
                      </div>

                      <div className="text-green-700 font-bold">
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

            <p className="text-sm text-red-600 mt-4">
              Esta acción no se puede deshacer.
            </p>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button
                onClick={
                  cancelConfirmation
                }
                className="w-full sm:w-auto px-4 py-2 border rounded-xl"
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
                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-xl disabled:opacity-60"
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