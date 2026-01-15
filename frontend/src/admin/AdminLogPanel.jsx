import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function AdminLogsPanel({ token }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await api.getLogs(token);
      setLogs(res.data);
    }
    load();
  }, [token]);

  return (
    <div className="p-4 bg-white shadow rounded-lg border">
      <h2 className="text-xl font-bold mb-4">Registro de actividad</h2>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-100">
            <th className="p-2">Fecha</th>
            <th className="p-2">Admin</th>
            <th className="p-2">Acción</th>
            <th className="p-2">Detalles</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-b">
              <td className="p-2">{new Date(l.createdAt).toLocaleString()}</td>
              <td className="p-2">{l.adminUsername}</td>
              <td className="p-2">{l.action}</td>
              <td className="p-2">{l.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
