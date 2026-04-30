import React, { useState } from "react";
import api from "../services/api";

export default function StudentsPanel({
  token
}) {
  const [csvFile, setCsvFile] =
    useState(null);

  const [msg, setMsg] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  async function uploadCSV(e) {
    e.preventDefault();

    if (!csvFile) {
      setMsg({
        type: "error",
        text:
          "Selecciona un archivo CSV."
      });
      return;
    }

    try {
      setLoading(true);
      setMsg(null);

      const res =
        await api.uploadStudentsCSV(
          csvFile,
          token
        );

      setMsg({
        type: "success",
        text: `Insertados: ${res.data.insertados} | Duplicados: ${res.data.duplicados} | Errores: ${res.data.errores}`
      });

    } catch {
      setMsg({
        type: "error",
        text:
          "Error subiendo CSV."
      });

    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e) {
    const file =
      e.target.files?.[0] ||
      null;

    setCsvFile(file);
    setMsg(null);
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-xl">

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold mb-4">
          📥 Importación masiva
        </div>

        <h2 className="text-3xl font-black">
          Importar Estudiantes
        </h2>

        <p className="text-blue-100 mt-2">
          Carga estudiantes desde archivo CSV para habilitar la verificación electoral.
        </p>
      </div>

      {/* UPLOAD CARD */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-xl p-6 space-y-6">

        <form
          onSubmit={uploadCSV}
          className="space-y-5"
        >

          {/* DROPZONE VISUAL */}
          <label className="block cursor-pointer">

            <input
              type="file"
              name="file"
              accept=".csv"
              onChange={
                handleFileChange
              }
              className="hidden"
            />

            <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 text-center hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition">

              <div className="text-4xl mb-3">
                📄
              </div>

              <div className="font-bold text-slate-800 dark:text-white">
                {csvFile
                  ? csvFile.name
                  : "Selecciona o arrastra tu archivo CSV"}
              </div>

              <div className="text-sm text-slate-500 mt-2 dark:text-slate-400">
                Solo archivos .csv
              </div>

            </div>
          </label>

          {/* HELP */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="font-semibold text-slate-800 dark:text-white mb-2">
              Formato recomendado:
            </div>

            <div>
              accountNumber,name,center,email
            </div>

            <div className="mt-2">
              Ejemplo:
              20190000111,Juan Pérez,VS,juan@email.com
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-3">

            <button
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                  Subiendo...
                </span>
              ) : (
                "📤 Subir CSV"
              )}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setCsvFile(null);
                setMsg(null);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border font-semibold hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition disabled:opacity-60"
            >
              Limpiar
            </button>

          </div>

        </form>
      </div>

      {/* MESSAGE */}
      {msg && (
        <div
          className={`rounded-2xl px-4 py-3 border text-sm font-medium ${
            msg.type ===
            "error"
              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30"
              : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30"
          }`}
        >
          {msg.text}
        </div>
      )}

    </div>
  );
}