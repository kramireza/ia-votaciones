import React, { useState } from "react";
import api from "../services/api";

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (loading) return;

    setMsg(null);
    setLoading(true);

    try {
      const res = await api.adminLogin(
        username,
        password
      );

      const token =
        res.data.token;

      onLogin(token);

      setMsg({
        type: "success",
        text:
          "Ingreso correcto."
      });
    } catch {
      setMsg({
        type: "error",
        text:
          "Usuario o contraseña inválidos."
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border bg-white shadow-xl p-6 md:p-8 dark:bg-slate-900 dark:border-slate-800">

      {/* HEADER */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white grid place-items-center text-2xl shadow-lg">
          🔐
        </div>

        <h3 className="text-2xl font-black text-slate-900 mt-4 dark:text-white">
          Ingreso Admin
        </h3>

        <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">
          Acceso seguro al panel administrativo
        </p>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleLogin}
        className="space-y-4"
      >

        {/* USERNAME */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">
            Usuario
          </label>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              👤
            </span>

            <input
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value
                )
              }
              autoComplete="username"
              className="w-full border rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
              required
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">
            Contraseña
          </label>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              🔑
            </span>

            <input
              placeholder="Ingresa tu contraseña"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              autoComplete="current-password"
              className="w-full border rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
              required
            />
          </div>
        </div>

        {/* BUTTON */}
        <button
          disabled={loading}
          className="w-full rounded-xl py-3 font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
              Ingresando...
            </span>
          ) : (
            "Entrar"
          )}
        </button>

        {/* MESSAGE */}
        {msg && (
          <div
            className={`rounded-2xl px-4 py-3 text-sm font-medium border ${
              msg.type ===
              "error"
                ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30"
                : "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/30"
            }`}
          >
            {msg.text}
          </div>
        )}

      </form>
    </div>
  );
}