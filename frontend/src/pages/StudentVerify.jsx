import React, {
  useState,
  useEffect
} from "react";
import api from "../services/api";

export default function StudentVerify({
  onVerified
}) {
  const [account, setAccount] =
    useState("");

  const [center, setCenter] =
    useState("");

  const [message, setMessage] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [
    activePollId,
    setActivePollId
  ] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res =
          await api.getActiveElection();

        setActivePollId(
          res.data?.pollId ||
            null
        );
      } catch {
        setActivePollId(
          null
        );
      }
    }

    load();
  }, []);

  async function handleVerify(e) {
    e.preventDefault();

    if (loading) return;

    setMessage(null);
    setLoading(true);

    try {
      const res =
        await api.verifyStudent(
          account.trim(),
          center.trim()
        );

      const studentData =
        res.data;

      if (!activePollId) {
        setMessage({
          type: "error",
          text:
            "No hay una elección activa en este momento."
        });

        setLoading(false);
        return;
      }

      try {
        const backend =
          await api.checkVote(
            activePollId,
            studentData.accountNumber
          );

        if (
          backend.data
            .hasVoted
        ) {
          setMessage({
            type: "error",
            text:
              "Ya has realizado tu voto para esta elección."
          });

          setLoading(false);
          return;
        }
      } catch {}

      setMessage({
        type: "success",
        text: `Bienvenido(a), ${studentData.name}`
      });

      onVerified(
        studentData
      );

    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data
            ?.message ||
          "Error de conexión."
      });

    } finally {
      setLoading(false);
    }
  }

  function clearForm() {
    setAccount("");
    setCenter("");
    setMessage(null);
  }

  return (
    <div className="rounded-3xl border bg-white shadow-xl p-6 md:p-8 dark:bg-slate-900 dark:border-slate-800">

      {/* HEADER */}
      <div className="mb-6 text-center md:text-left">

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 mb-4 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20">
          🎓 Acceso Estudiantil
        </div>

        <div className="w-16 h-16 mx-auto md:mx-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white grid place-items-center text-2xl shadow-lg">
          🧾
        </div>

        <h2 className="text-3xl font-black text-slate-900 mt-4 dark:text-white">
          Verificación de Estudiante
        </h2>

        <p className="text-slate-500 mt-2 dark:text-slate-400">
          Ingresa tus datos para continuar al proceso de votación.
        </p>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleVerify}
        className="space-y-5"
      >

        {/* ACCOUNT */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
            Número de cuenta
          </label>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              🆔
            </span>

            <input
              value={account}
              onChange={(e) =>
                setAccount(
                  e.target.value
                )
              }
              className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
              placeholder="Ej. 20190000111"
              required
            />
          </div>
        </div>

        {/* CENTER */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
            Centro
          </label>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              📍
            </span>

            <select
              value={center}
              onChange={(e) =>
                setCenter(
                  e.target.value
                )
              }
              className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition appearance-none bg-white text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              required
            >
              <option value="">
                -- Selecciona --
              </option>

              <option value="VS">
                VS
              </option>

              <option value="CU">
                CU
              </option>

              <option value="Danlí">
                Danlí
              </option>

              <option value="Otro">
                Otro
              </option>
            </select>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">

          <button
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                Verificando...
              </span>
            ) : (
              "Verificar"
            )}
          </button>

          <button
            type="button"
            onClick={
              clearForm
            }
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border font-semibold transition disabled:opacity-60 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Limpiar
          </button>

        </div>

        {/* MESSAGE */}
        {message && (
          <div
            className={`rounded-2xl px-4 py-3 text-sm font-medium border ${
              message.type ===
              "error"
                ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30"
            }`}
          >
            {message.text}
          </div>
        )}

      </form>
    </div>
  );
}