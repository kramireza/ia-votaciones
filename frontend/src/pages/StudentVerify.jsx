import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function StudentVerify({ onVerified }) {
  const [account, setAccount] = useState("");
  const [center, setCenter] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePollId, setActivePollId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getActiveElection();
        setActivePollId(res.data?.pollId || null);
      } catch {
        setActivePollId(null);
      }
    }

    load();
  }, []);

  async function handleVerify(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const res = await api.verifyStudent(
        account.trim(),
        center.trim()
      );

      const studentData = res.data;
      setLoading(false);

      if (!activePollId) {
        setMessage({
          type: "error",
          text: "No hay una elección activa en este momento."
        });
        return;
      }

      try {
        const backend = await api.checkVote(
          activePollId,
          studentData.accountNumber
        );

        if (backend.data.hasVoted) {
          setMessage({
            type: "error",
            text: "Ya has realizado tu voto para esta elección."
          });
          return;
        }
      } catch {}

      setMessage({
        type: "success",
        text: `Bienvenido(a), ${studentData.name}`
      });

      onVerified(studentData);

    } catch (err) {
      setLoading(false);

      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Error de conexión."
      });
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border p-6 md:p-8">

      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-900">
          Verificación de Estudiante
        </h2>

        <p className="text-slate-500 mt-2">
          Ingresa tus datos para continuar al proceso de votación.
        </p>
      </div>

      <form
        onSubmit={handleVerify}
        className="space-y-5"
      >
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">
            Número de cuenta
          </label>

          <input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Ej. 20190000111"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">
            Centro
          </label>

          <select
            value={center}
            onChange={(e) => setCenter(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          >
            <option value="">-- Selecciona --</option>
            <option value="VS">VS</option>
            <option value="CU">CU</option>
            <option value="Danlí">Danlí</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">

          <button
            disabled={loading}
            className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            {loading ? "Verificando..." : "Verificar"}
          </button>

          <button
            type="button"
            onClick={() => {
              setAccount("");
              setCenter("");
              setMessage(null);
            }}
            className="px-5 py-3 border rounded-xl font-semibold hover:bg-slate-50 transition"
          >
            Limpiar
          </button>

        </div>

        {message && (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium ${
              message.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {message.text}
          </div>
        )}

      </form>
    </div>
  );
}