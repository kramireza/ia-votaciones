import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function VotingPage({ student, onVoted }) {
  const navigate = useNavigate();

  const [poll, setPoll] = useState(null);

  // SIMPLE
  const [selected, setSelected] = useState("");

  // COMPOUND
  const [answers, setAnswers] = useState({});

  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const [backendChecked, setBackendChecked] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const voteKey = poll
    ? `voted_${poll.pollId}_${student.accountNumber}`
    : null;

  // =====================================================
  // LOAD POLL
  // =====================================================
  useEffect(() => {
    async function loadPoll() {
      try {
        const res = await api.getActiveElection();
        setPoll(res.data);
      } catch {
        setStatus({
          type: "error",
          text: "No se pudo cargar la elección activa."
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
        const res = await api.checkVote(
          poll.pollId,
          student.accountNumber
        );

        if (res.data.hasVoted) {
          setStatus({
            type: "info",
            text: "Ya registraste un voto para esta votación."
          });
        } else {
          localStorage.removeItem(voteKey);
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
    if (!voteKey || !backendChecked) return;

    const voted = localStorage.getItem(voteKey);

    if (voted) {
      setStatus({
        type: "info",
        text: "Ya registraste un voto para esta votación."
      });
    }
  }, [voteKey, backendChecked]);

  // =====================================================
  // REDIRECT
  // =====================================================
  useEffect(() => {
    if (status?.type === "success") {
      setCountdown(5);

      const timer = setInterval(() => {
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

      return () => clearInterval(timer);
    }
  }, [status]);

  // =====================================================
  // VALIDATE BEFORE MODAL
  // =====================================================
  function submitVote(e) {
    e.preventDefault();
    setStatus(null);

    const type = poll?.type || "simple";

    if (type === "simple") {
      if (!selected) {
        setStatus({
          type: "error",
          text: "Selecciona una opción antes de votar."
        });
        return;
      }
    }

    if (type === "compound") {
      const sections = poll.sections || [];

      for (const sec of sections) {
        if (!answers[sec.title]) {
          setStatus({
            type: "error",
            text:
              "Debes responder todas las secciones."
          });
          return;
        }
      }
    }

    const already = localStorage.getItem(voteKey);

    if (already) {
      setStatus({
        type: "error",
        text: "Ya has votado."
      });
      return;
    }

    if (status?.type === "info") {
      setStatus({
        type: "error",
        text: "Ya registraste un voto."
      });
      return;
    }

    setShowConfirmModal(true);
  }

  // =====================================================
  // CONFIRM VOTE
  // =====================================================
  async function confirmVote() {
    if (!poll || !student) return;

    const type = poll.type || "simple";

    setSubmitting(true);

    try {
      const payload = {
        studentAccount: student.accountNumber,
        studentName: student.name,
        studentCenter: student.center,
        pollId: poll.pollId
      };

      if (type === "simple") {
        payload.option = selected;
      }

      if (type === "compound") {
        payload.answers = answers;
      }

      await api.castVote(payload);

      localStorage.setItem(
        voteKey,
        JSON.stringify({
          type,
          option: selected,
          answers,
          timestamp: new Date().toISOString()
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
          err.response?.data?.message ||
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
        <p>Cargando elección...</p>
      </div>
    );
  }

  const type = poll.type || "simple";

  const API_BASE =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:4001";

  return (
    <>
      <div className="card space-y-6">

        {/* HEADER */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            {poll.title}
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Votando como{" "}
            <strong>{student.name}</strong> —{" "}
            {student.accountNumber}
          </p>
        </div>

        <form
          onSubmit={submitVote}
          className="space-y-6"
        >

          {/* SIMPLE */}
          {type === "simple" && (
            <div className="grid gap-4">
              {(poll.options || []).map(
                (opt, index) => (
                  <label
                    key={index}
                    className="border rounded-2xl p-4 cursor-pointer hover:bg-slate-50 flex gap-4"
                  >
                    <input
                      type="radio"
                      checked={
                        selected === opt.text
                      }
                      onChange={() =>
                        setSelected(opt.text)
                      }
                    />

                    <div className="flex-1">
                      <div className="font-bold text-lg">
                        {opt.text}
                      </div>

                      {opt.description && (
                        <div className="text-sm text-slate-500">
                          {opt.description}
                        </div>
                      )}

                      {opt.imageUrl && (
                        <img
                          src={`${API_BASE}${opt.imageUrl}`}
                          className="w-32 h-32 rounded-lg border object-cover mt-3"
                        />
                      )}
                    </div>
                  </label>
                )
              )}
            </div>
          )}

          {/* COMPOUND */}
          {type === "compound" && (
            <div className="space-y-8">
              {(poll.sections || []).map(
                (section, i) => (
                  <div
                    key={i}
                    className="border rounded-2xl p-5 bg-slate-50"
                  >
                    <h3 className="text-xl font-bold mb-4 text-indigo-700">
                      {section.title}
                    </h3>

                    <div className="grid gap-3">
                      {(
                        section.options ||
                        []
                      ).map((opt, j) => (
                        <label
                          key={j}
                          className="border rounded-xl p-4 bg-white hover:bg-indigo-50 cursor-pointer flex gap-3"
                        >
                          <input
                            type="radio"
                            checked={
                              answers[
                                section.title
                              ] ===
                              opt.text
                            }
                            onChange={() =>
                              setAnswers({
                                ...answers,
                                [section.title]:
                                  opt.text
                              })
                            }
                          />

                          <div className="flex-1">
                            <div className="font-semibold">
                              {opt.text}
                            </div>

                            {opt.description && (
                              <div className="text-sm text-slate-500">
                                {
                                  opt.description
                                }
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* BUTTONS */}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={
                submitting ||
                status?.type ===
                  "success"
              }
              className="px-5 py-3 bg-green-600 text-white rounded-xl font-semibold"
            >
              {submitting
                ? "Enviando..."
                : "Votar"}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelected("");
                setAnswers({});
                setStatus(null);
              }}
              className="px-5 py-3 border rounded-xl"
            >
              Limpiar
            </button>
          </div>

          {/* STATUS */}
          {status && (
            <div
              className={`rounded-xl px-4 py-3 ${
                status.type === "error"
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
                Serás redirigido a resultados en{" "}
                <strong>
                  {countdown}
                </strong>{" "}
                segundos...
              </p>

              <div className="w-full bg-slate-300 h-2 rounded mt-3">
                <div
                  className="bg-green-600 h-2 rounded"
                  style={{
                    width: `${
                      (countdown / 5) *
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">

            <h3 className="text-2xl font-bold mb-4">
              Confirmar voto
            </h3>

            {/* SIMPLE */}
            {type === "simple" && (
              <>
                <p className="mb-2">
                  Vas a votar por:
                </p>

                <div className="border rounded-xl p-3 bg-slate-50 font-semibold text-green-700">
                  {selected}
                </div>
              </>
            )}

            {/* COMPOUND */}
            {type === "compound" && (
              <div className="space-y-3">
                {(poll.sections || []).map(
                  (sec, i) => (
                    <div
                      key={i}
                      className="border rounded-xl p-3 bg-slate-50"
                    >
                      <div className="font-semibold text-slate-700">
                        {sec.title}
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

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={cancelConfirmation}
                className="px-4 py-2 border rounded-xl"
              >
                Cancelar
              </button>

              <button
                onClick={confirmVote}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-xl"
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