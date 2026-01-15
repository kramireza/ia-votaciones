import React, { useEffect, useState } from "react";
import api from "../services/api";

// 📊 Chart
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

// 🧾 PDF
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function ResultsPanel({ token }) {

  const [elections, setElections] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:4000";

  // -------------------------------------------------------------
  // Cargar elecciones
  // -------------------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await api.getElections(token);
        setElections(res.data);
      } catch (err) {
        console.error("Error cargando elecciones", err);
        alert("No se pudieron cargar las elecciones");
      }
    }
    load();
  }, [token]);

  // -------------------------------------------------------------
  // Cargar resultados
  // -------------------------------------------------------------
  async function loadResults(pollId) {
    setLoading(true);
    setResult(null);

    try {
      const res = await api.getDetailedResults(pollId, token);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Error cargando resultados");
    }

    setLoading(false);
  }

  // -------------------------------------------------------------
  // Exportar PDF
  // -------------------------------------------------------------
  async function exportPDF() {
    const element = document.getElementById("results-area");

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = 210;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
    pdf.save(`resultados_${result.pollId}.pdf`);

    // 📌 REGISTRAR LOG EN BACKEND
    await api.post(`/logs/pdf`, {
      pollTitle: result.title
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  return (
    <div>

      <h2 className="text-2xl font-bold mb-4">Resultados de Elecciones</h2>

      {/* SELECTOR DE ELECCIÓN */}
      <select
        className="input p-2 border rounded w-80 mb-6"
        value={selectedPoll || ""}
        onChange={(e) => {
          setSelectedPoll(e.target.value);
          if (e.target.value) loadResults(e.target.value);
        }}
      >
        <option value="">-- Selecciona una elección --</option>
        {elections.map((e) => (
          <option key={e.pollId} value={e.pollId}>
            {e.title}
          </option>
        ))}
      </select>

      {loading && <p>Cargando...</p>}

      {result && (
        <div className="space-y-6" id="results-area">

          {/* BOTÓN PDF */}
          <button
            onClick={exportPDF}
            className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700"
          >
            Exportar PDF
          </button>

          {/* 🔥🔥 BOTONES DE EXCEL (AGREGADOS AQUÍ) 🔥🔥 */}
          <div className="flex gap-4 mt-4">

            {/* Excel — votos completos */}
            <button
              onClick={async () => {
                try {
                  const res = await api.exportExcelAll(token, selectedPoll);
                  const blob = new Blob([res.data]);
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `votos_${selectedPoll}.xlsx`;
                  a.click();
                } catch {
                  alert("Error exportando votos");
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700"
            >
              Descargar Excel (Votos)
            </button>

            {/* Excel — resultados agrupados */}
            <button
              onClick={async () => {
                try {
                  const res = await api.exportExcelResults(token, selectedPoll);
                  const blob = new Blob([res.data]);
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `resultados_${selectedPoll}.xlsx`;
                  a.click();
                } catch {
                  alert("Error exportando resultados");
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
            >
              Descargar Excel (Resultados)
            </button>

          </div>
          {/* 🔥 FIN DEL BLOQUE AÑADIDO */}

          {/* TÍTULO Y TOTAL */}
          <div className="p-4 bg-white border rounded shadow">
            <h3 className="text-xl font-semibold">{result.title}</h3>
            <p className="text-gray-600">Total de votos: {result.totalVotes}</p>
          </div>

          {/* LISTA DE OPCIONES */}
          {result.options.map((opt, i) => {
            const percent =
              result.totalVotes > 0
                ? ((opt.votes / result.totalVotes) * 100).toFixed(1)
                : 0;

            return (
              <div
                key={i}
                className="p-4 bg-white border rounded shadow flex gap-4 items-center"
              >
                {/* Imagen */}
                {opt.imageUrl && (
                  <img
                    src={`${API_BASE}${opt.imageUrl}`}
                    className="w-24 h-24 object-cover rounded border"
                  />
                )}

                {/* Detalles */}
                <div className="flex-1">
                  <div className="font-semibold text-lg">{opt.text}</div>
                  <div className="text-gray-600 text-sm">
                    {opt.votes} votos ({percent}%)
                  </div>

                  {/* Barra */}
                  <div className="w-full bg-gray-200 h-3 rounded mt-2">
                    <div
                      className="bg-indigo-600 h-3 rounded"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 📊 GRÁFICO DE BARRAS */}
          <div className="bg-white p-6 border rounded shadow">
            <h3 className="text-lg font-semibold mb-4">Gráfico de Barras</h3>

            <Bar
              data={{
                labels: result.options.map((o) => o.text),
                datasets: [
                  {
                    label: "Votos",
                    data: result.options.map((o) => o.votes),
                    backgroundColor: "rgba(54, 162, 235, 0.6)",
                    borderColor: "rgba(54, 162, 235, 1)",
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </div>

        </div>
      )}
    </div>
  );
}
