import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function VotingPage({ student, onVoted }) {
  const navigate = useNavigate();

  const [poll, setPoll] = useState(null);
  const [selected, setSelected] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const [backendChecked, setBackendChecked] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const voteKey = poll
    ? `voted_${poll.pollId}_${student.accountNumber}`
    : null;

  // ==========================================================
  // CARGAR ELECCIÓN
  // ==========================================================
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

  // ==========================================================
  // VALIDAR BACKEND
  // ==========================================================
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

  // ==========================================================
  // VALIDAR LOCAL
  // ==========================================================
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

  // ==========================================================
  // CONTADOR + REDIRECT
  // ==========================================================
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

  // ==========================================================
  // ABRIR CONFIRMACIÓN
  // ==========================================================
  function submitVote(e) {
    e.preventDefault();
    setStatus(null);

    if (!selected) {
      setStatus({
        type: "error",
        text: "Selecciona una opción antes de votar."
      });
      return;
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

  // ==========================================================
  // CONFIRMAR VOTO
  // ==========================================================
  async function confirmVote() {
    if (!selected || !poll || !student) return;

    const already = localStorage.getItem(voteKey);

    if (already) {
      setShowConfirmModal(false);
      setStatus({
        type: "error",
        text: "Ya votaste."
      });
      return;
    }

    setSubmitting(true);

    try {
      await api.castVote({
        studentAccount: student.accountNumber,
        studentName: student.name,
        studentCenter: student.center,
        pollId: poll.pollId,
        option: selected
      });

      localStorage.setItem(
        voteKey,
        JSON.stringify({
          option: selected,
          timestamp: new Date().toISOString()
        })
      );

      setShowConfirmModal(false);

      setStatus({
        type: "success",
        text: "Voto registrado correctamente. Gracias por participar."
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

  // ==========================================================
  // LOADING
  // ==========================================================
  if (!poll) {
    return (
      <div className="card">
        <p>Cargando elección...</p>
      </div>
    );
  }

  const API_BASE =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:4000";

  return (
    <>
      <div className="card">
        <h2 className="text-2xl font-semibold mb-3">
          {poll.title}
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Votando como <strong>{student.name}</strong> —{" "}
          {student.accountNumber}
        </p>

        <form
          onSubmit={submitVote}
          className="space-y-4"
        >
          <div className="grid gap-3">
            {poll.options.map((opt, index) => (
              <label
                key={index}
                className="flex gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  value={opt.text}
                  checked={selected === opt.text}
                  onChange={() => setSelected(opt.text)}
                />

                <div className="flex-1">
                  <div className="font-semibold text-lg">
                    {opt.text}
                  </div>

                  {opt.description && (
                    <div className="text-sm text-gray-600">
                      {opt.description}
                    </div>
                  )}

                  {opt.imageUrl && (
                    <img
                      src={`${API_BASE}${opt.imageUrl}`}
                      className="w-32 h-32 object-cover rounded mt-2 border"
                    />
                  )}
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={
                submitting ||
                status?.type === "success"
              }
              className="bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              {submitting ? "Enviando..." : "Votar"}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelected("");
                setStatus(null);
              }}
              className="px-4 py-2 border rounded-lg"
            >
              Limpiar
            </button>
          </div>

          {status && (
            <div
              className={
                status.type === "error"
                  ? "text-red-600"
                  : status.type === "success"
                  ? "text-green-600"
                  : "text-blue-600"
              }
            >
              {status.text}
            </div>
          )}

          {status?.type === "success" && (
            <div className="mt-4 bg-gray-100 p-3 rounded-lg border">
              <p className="text-sm">
                Serás redirigido a resultados en{" "}
                <strong>{countdown}</strong> segundos...
              </p>

              <div className="w-full bg-gray-300 h-2 rounded mt-2">
                <div
                  className="bg-green-600 h-2 rounded"
                  style={{
                    width: `${(countdown / 5) * 100}%`,
                    transition: "1s linear"
                  }}
                ></div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-3">
              Confirmar voto
            </h3>

            <p className="mb-2">
              Vas a votar por:
            </p>

            <div className="p-3 border rounded bg-gray-50 mb-4 font-semibold text-green-700">
              {selected}
            </div>

            <p className="text-sm text-red-600 mb-4">
              Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelConfirmation}
                className="px-4 py-2 border rounded-lg"
              >
                Cancelar
              </button>

              <button
                onClick={confirmVote}
                disabled={submitting}
                className="bg-green-600 text-white px-4 py-2 rounded-lg"
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