import React, { useState } from "react";
import api from "../services/api";

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await api.adminLogin(username, password);
      const token = res.data.token;
      onLogin(token);
      setMsg({ type: "success", text: "Ingreso correcto." });
    } catch {
      setMsg({ type: "error", text: "Usuario o contraseña inválidos." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Ingreso Admin</h3>
      <form onSubmit={handleLogin} className="space-y-3">
        <input placeholder="Usuario" value={username} onChange={(e)=>setUsername(e.target.value)} className="w-full border p-2 rounded-lg" />
        <input placeholder="Contraseña" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full border p-2 rounded-lg" />
        <div className="flex gap-3">
          <button disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">{loading ? "Ingresando..." : "Entrar"}</button>
        </div>

        {msg && <div className={msg.type === "error" ? "text-red-600 mt-2" : "text-green-600 mt-2"}>{msg.text}</div>}
      </form>
    </div>
  );
}
