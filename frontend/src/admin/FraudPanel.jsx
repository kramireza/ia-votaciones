import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function FraudPanel({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState([]);

  async function loadData() {
    try {
      const trendRes = await axios.get("/api/fraud/trend", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTrend(trendRes.data);
      const res = await axios.get(
        "/api/fraud/summary",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setData(res.data);
    } catch (error) {
      console.error("Error fraude:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-12 h-12 mx-auto rounded-full border-b-4 border-indigo-600 animate-spin"></div>
        <p className="mt-4 text-slate-500 dark:text-slate-400">
          Analizando actividad...
        </p>
      </div>
    );
  }

  if (!data) {
    return <p>Error cargando datos</p>;
  }

  return (
    <div className="space-y-6">

      {/* 🔥 CARDS RESUMEN */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">

        <Card title="Total Votos" value={data.totalVotes} color="indigo" />
        <Card title="IPs únicas" value={data.totalIPs} color="blue" />
        <Card title="IPs sospechosas" value={data.suspiciousIPs.length} color="red" />
        <Card title="Actividad reciente" value={data.recentVotes} color="emerald" />

      </div>

      {/* 📊 GRÁFICA */}
      <div className="rounded-2xl border p-5 bg-white dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-xl font-bold mb-4">
          📊 Actividad por IP
        </h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.topIPs}>
            <XAxis dataKey="ipAddress" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 📈 TENDENCIA */}
      <div className="rounded-2xl border p-5 bg-white dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-xl font-bold mb-4">
          📈 Tendencia por hora
        </h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={trend}>
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="votes" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 🔥 TOP IPS */}
      <div className="rounded-2xl border p-5 bg-white dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-xl font-bold mb-4">
          🔝 IPs con más votos
        </h2>

        <div className="space-y-3">
          {data.topIPs.map((ip, i) => (
            <div
              key={i}
              className="flex justify-between items-center px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800"
            >
              <span className="font-mono">{ip.ipAddress || "N/A"}</span>
              <span className="font-bold text-indigo-600">
                {ip.count} votos
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 🚨 SOSPECHOSOS */}
      <div className="rounded-2xl border p-5 bg-white dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-xl font-bold mb-4 text-red-600">
          🚨 IPs sospechosas
        </h2>

        {data.suspiciousIPs.length === 0 ? (
          <p className="text-slate-500">
            No se detectaron anomalías
          </p>
        ) : (
          <div className="space-y-3">
            {data.suspiciousIPs.map((ip, i) => (
              <div
                key={i}
                className="flex justify-between items-center px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono">{ip.ipAddress}</span>

                  <button
                    onClick={async () => {
                      await axios.post("/api/fraud/block", {
                        ip: ip.ipAddress
                      }, {
                        headers: {
                          Authorization: `Bearer ${token}`
                        }
                      });

                      alert("IP bloqueada");
                      loadData();
                    }}
                    className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg"
                  >
                    Bloquear
                  </button>
                </div>
                <span className="font-bold text-red-600">
                  {ip.count} votos
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

// 🔹 COMPONENTE CARD
function Card({ title, value, color }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    red: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
  };

  return (
    <div className={`rounded-2xl p-5 border shadow-sm ${colors[color]}`}>
      <div className="text-sm opacity-70">{title}</div>
      <div className="text-2xl font-black mt-1">{value}</div>
    </div>
  );
}