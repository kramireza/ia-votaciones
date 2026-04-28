import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function StudentVerify({ onVerified }) {
  const navigate = useNavigate();

  const [account, setAccount] = useState("");
  const [center, setCenter] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const [activePollId, setActivePollId] = useState(null);

  // ========================================================
  // CARGAR ELECCIÓN ACTIVA
  // ========================================================
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

  // ========================================================
  // VERIFICAR ESTUDIANTE
  // ========================================================
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
      } catch (err) {
        console.log(err);
      }

      setMessage({
        type: "success",
        text: `Bienvenido(a), ${studentData.name}`
      });

      onVerified(studentData);

    } catch (err) {
      setLoading(false);

      const text =
        err.response?.data?.message ||
        "Error de conexión.";

      setMessage({
        type: "error",
        text
      });
    }
  }

  // ========================================================
  // RENDER
  // ========================================================
  return (
    <div className="card">
      <h2 className="text-2xl font-semibold mb-4">
        Verificación de Estudiante
      </h2>

      <form
        onSubmit={handleVerify}
        className="space-y-4"
      >
        {/* CUENTA */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Número de cuenta
          </label>

          <input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="w-full border rounded-lg p-2"
            placeholder="Ej. 20190000111"
            required
          />
        </div>

        {/* CENTRO */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Centro
          </label>

          <select
            value={center}
            onChange={(e) => setCenter(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          >
            <option value="">-- Selecciona --</option>
            <option value="VS">VS</option>
            <option value="CU">CU</option>
            <option value="Danlí">Danlí</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        {/* BOTONES */}
        <div className="flex flex-wrap gap-3">
          <button
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
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
            className="px-4 py-2 border rounded-lg"
          >
            Limpiar
          </button>

          {/* 🔥 NUEVO */}
          <button
            type="button"
            onClick={() => navigate("/resultados")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Ver Resultados Públicos
          </button>
        </div>

        {/* MENSAJES */}
        {message && (
          <div
            className={
              message.type === "error"
                ? "text-red-600"
                : "text-green-600"
            }
          >
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}