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

      } catch { /* empty */ }

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
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) clearInterval(timer);
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status]);

  // ============================================================
  // ENVIAR VOTO
  // ============================================================
  async function submitVote(e) {
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
        localStorage.setItem(voteKey, JSON.stringify({ option: selected, timestamp: new Date().toISOString() }));
      }

      setStatus({
        type: "success",
        text: "Voto registrado correctamente. Gracias por participar."
      });

      onVoted?.();

    } catch (err) {
      const text = err.response?.data?.message || "Error al registrar voto.";
      setStatus({ type: "error", text });
    } finally {
      setSubmitting(false);
    }
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

  const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:4000";

  return (
    <div className="card">
      <h2 className="text-2xl font-semibold mb-3">{poll.title}</h2>
      <p className="text-sm text-gray-600 mb-4">
        Votando como <strong>{student.name}</strong> — {student.accountNumber}
      </p>

      <form onSubmit={submitVote} className="space-y-4">
        <div className="grid gap-3">

          {Array.isArray(poll.options) && poll.options.map((opt, index) => (
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
            disabled={submitting || status?.type === "success"}
            className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {submitting ? "Enviando..." : "Votar"}
          </button>

          <button
            type="button"
            onClick={() => { setSelected(""); setStatus(null); }}
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
  );
}
