import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function VotingPage({ student, onVoted }) {
  const [poll, setPoll] = useState(null);
  const [selected, setSelected] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // ⭐ Nuevo: esperamos la validación real del backend
  const [backendChecked, setBackendChecked] = useState(false);

  // ⭐ Nuevo: estado del popup/modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ============================================================
  // Clave del voto (NO borra nada)
  // ============================================================
  const voteKey = poll ? `voted_${poll.pollId}_${student.accountNumber}` : null;

  // ============================================================
  // Cargar elección
  // ============================================================
  useEffect(() => {
    async function loadPoll() {
      try {
        const res = await api.getActiveElection();
        setPoll(res.data);
      } catch {
        setStatus({ type: "error", text: "No se pudo cargar la elección activa." });
      }
    }

    loadPoll();
  }, []);

  // ============================================================
  // VALIDAR CONTRA EL BACKEND SI REALMENTE YA VOTÓ
  // CORREGIDO: ya no escribe en localStorage si NO debe
  // ============================================================
  useEffect(() => {
    async function validateBackendVote() {
      if (!student || !poll) return;

      try {
        const res = await api.checkVote(poll.pollId, student.accountNumber);

        if (res.data.hasVoted) {
          setStatus({
            type: "info",
            text: "Ya registraste un voto para esta votación."
          });
        } else {
          // limpiar localStorage si el backend dice que NO votó
          localStorage.removeItem(`voted_${poll.pollId}_${student.accountNumber}`);
        }
      } catch {
        /* empty */
      }

      // 🔥 IMPORTANTE: marcar que el backend ya respondió
      setBackendChecked(true);
    }

    validateBackendVote();
  }, [poll, student]);

  // ============================================================
  // Validar si ya votó (local) — AHORA ESPERA AL BACKEND
  // ============================================================
  useEffect(() => {
    if (!voteKey || !backendChecked) return;

    const voted = localStorage.getItem(voteKey);
    if (voted) {
      setStatus({ type: "info", text: "Ya registraste un voto para esta votación." });
    }
  }, [voteKey, backendChecked]);

  // ============================================================
  // Contador al finalizar voto
  // ============================================================
  useEffect(() => {
    if (status?.type === "success") {
      setCountdown(5);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status]);

  // ============================================================
  // Primer paso: abrir popup de confirmación
  // AQUÍ TODAVÍA NO SE REGISTRA EL VOTO
  // ============================================================
  function submitVote(e) {
    e.preventDefault();
    setStatus(null);

    if (!selected) {
      setStatus({ type: "error", text: "Selecciona una opción antes de votar." });
      return;
    }

    const already = localStorage.getItem(voteKey);
    if (already) {
      setStatus({ type: "error", text: "Ya has votado en esta votación." });
      return;
    }

    if (status?.type === "info") {
      setStatus({ type: "error", text: "Ya registraste un voto para esta votación." });
      return;
    }

    setShowConfirmModal(true);
  }

  // ============================================================
  // Segundo paso: confirmar voto
  // SOLO AQUÍ se envía al backend
  // ============================================================
  async function confirmVote() {
    if (!selected || !poll || !student) return;

    const already = localStorage.getItem(voteKey);
    if (already) {
      setShowConfirmModal(false);
      setStatus({ type: "error", text: "Ya has votado en esta votación." });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        studentAccount: student.accountNumber,
        studentName: student.name,
        studentCenter: student.center,
        pollId: poll.pollId,
        option: selected
      };

      await api.castVote(payload);

      if (voteKey) {
        localStorage.setItem(
          voteKey,
          JSON.stringify({
            option: selected,
            timestamp: new Date().toISOString()
          })
        );
      }

      setShowConfirmModal(false);

      setStatus({
        type: "success",
        text: "Voto registrado correctamente. Gracias por participar."
      });

      onVoted?.();
    } catch (err) {
      const text = err.response?.data?.message || "Error al registrar voto.";
      setShowConfirmModal(false);
      setStatus({ type: "error", text });
    } finally {
      setSubmitting(false);
    }
  }

  // ============================================================
  // Cerrar popup
  // ============================================================
  function cancelConfirmation() {
    if (submitting) return;
    setShowConfirmModal(false);
  }

  // ============================================================
  // Render
  // ============================================================
  if (!poll) {
    return (
      <div className="card">
        <p className="text-gray-600">Cargando elección...</p>
      </div>
    );
  }

  const API_BASE =
    import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:4000";

  return (
    <>
      <div className="card">
        <h2 className="text-2xl font-semibold mb-3">{poll.title}</h2>
        <p className="text-sm text-gray-600 mb-4">
          Votando como <strong>{student.name}</strong> — {student.accountNumber}
        </p>

        <form onSubmit={submitVote} className="space-y-4">
          <div className="grid gap-3">
            {Array.isArray(poll.options) &&
              poll.options.map((opt, index) => (
                <label
                  key={index}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="option"
                    value={opt.text}
                    checked={selected === opt.text}
                    onChange={() => setSelected(opt.text)}
                    className="mt-2"
                  />

                  <div className="flex flex-col">
                    <div className="font-semibold text-lg">{opt.text}</div>

                    {/* DESCRIPCION (si existe) */}
                    {opt.description && opt.description.trim() !== "" && (
                      <div className="text-sm text-gray-600 mt-1">{opt.description}</div>
                    )}

                    {opt.imageUrl && (
                      <img
                        src={`${API_BASE}${opt.imageUrl}`}
                        alt="Foto del candidato"
                        className="w-32 h-32 object-cover rounded mt-2 border shadow"
                      />
                    )}
                  </div>
                </label>
              ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || status?.type === "success"}
              className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {submitting ? "Enviando..." : "Votar"}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelected("");
                setStatus(null);
              }}
              className="px-3 py-2 border rounded-lg"
            >
              Limpiar
            </button>
          </div>

          {status && (
            <div
              className={`mt-3 ${
                status.type === "error"
                  ? "text-red-600"
                  : status.type === "success"
                  ? "text-green-600"
                  : "text-blue-600"
              }`}
            >
              {status.text}
            </div>
          )}

          {status?.type === "success" && (
            <div className="mt-5 p-3 bg-gray-100 rounded-lg border">
              <p className="text-sm text-gray-700">
                Serás redirigido al inicio en <strong>{countdown}</strong> segundos…
              </p>
              <div className="w-full bg-gray-300 h-2 rounded mt-2">
                <div
                  className="bg-green-600 h-2 rounded"
                  style={{
                    width: `${(countdown / 5) * 100}%`,
                    transition: "width 1s linear"
                  }}
                ></div>
              </div>
            </div>
          )}
        </form>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Confirmar voto
            </h3>

            <p className="text-gray-600 mb-2">
              Estás a punto de registrar tu voto por:
            </p>

            <div className="p-3 rounded-lg border bg-gray-50 mb-4">
              <p className="font-semibold text-lg text-green-700">{selected}</p>
            </div>

            <p className="text-sm text-red-600 mb-5">
              Esta acción no se puede deshacer. Verifica tu selección antes de confirmar.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={cancelConfirmation}
                disabled={submitting}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmVote}
                disabled={submitting}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? "Confirmando..." : "Confirmar voto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}