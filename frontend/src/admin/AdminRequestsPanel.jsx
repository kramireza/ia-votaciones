// src/admin/AdminRequestsPanel.jsx
import React, { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import { getRoleFromToken } from "../services/auth";

export default function AdminRequestsPanel({ token }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // objeto solicitud seleccionado
  const [showModal, setShowModal] = useState(false);
  const [titleMap, setTitleMap] = useState({}); // map pollId -> title

  // role y username desde token
  const role = getRoleFromToken(token);
  let username = null;
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      username = payload.username || payload.user || payload.name || payload.sub || null;
    }
  } catch {
    username = null;
  }

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getApprovalRequests(token);
      let allRequests = Array.isArray(res.data) ? res.data : [];

      // build title map (so we can show election name in list)
      let map = {};
      try {
        const elect = await api.getElections(token);
        if (Array.isArray(elect.data)) {
          elect.data.forEach(e => {
            map[e.pollId] = e.title;
          });
        }
      } catch {
        // ignore, fallback to payload title or pollId
      }
      setTitleMap(map);

      // si es editor, filtrar solo solicitudes propias
      if (role === "editor" && username) {
        allRequests = allRequests.filter(r => r.requestedBy === username);
      }

      setRequests(allRequests);
    } catch (err) {
      console.error("Error cargando solicitudes:", err);
      alert("Error cargando solicitudes");
    } finally {
      setLoading(false);
    }
  }, [token, role, username]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function openRequestModal(id) {
    try {
      const res = await api.getApprovalRequest(id, token);
      setSelected(res.data);
      setShowModal(true);
    } catch (err) {
      console.error("Error cargando solicitud:", err);
      alert("Error cargando solicitud");
    }
  }

  async function approve(id) {
    const comment = prompt("Comentario (opcional) al aprobar:");
    try {
      await api.approveRequest(id, token, comment || "");
      alert("Solicitud aprobada");
      setShowModal(false);
      setSelected(null);
      await fetchRequests();
    } catch (err) {
      console.error("Error aprobando solicitud:", err);
      alert("Error aprobando solicitud");
    }
  }

  async function rejectReq(id) {
    const comment = prompt("Motivo/rechazo (opcional):");
    try {
      await api.rejectRequest(id, token, comment || "");
      alert("Solicitud rechazada");
      setShowModal(false);
      setSelected(null);
      await fetchRequests();
    } catch (err) {
      console.error("Error rechazando solicitud:", err);
      alert("Error rechazando solicitud");
    }
  }

  function getReadableType(t) {
    if (t === "edit") return "Solicitud de edición";
    if (t === "delete") return "Solicitud de eliminación";
    return t;
  }

  function getRequestTitle(r) {
    if (!r) return "";
    if (r.payload && r.payload.title) return r.payload.title;
    if (titleMap[r.pollId]) return titleMap[r.pollId];
    return r.pollId;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Solicitudes</h2>

      {loading ? <p>Cargando...</p> : null}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <h3 className="font-semibold">Lista</h3>
          <ul>
            {requests.map(r => (
              <li
                key={r.id}
                className="border p-2 mb-2 cursor-pointer hover:bg-gray-50"
                onClick={() => openRequestModal(r.id)}
              >
                <div className="font-semibold">
                  #{r.id} — {getReadableType(r.type)} — {getRequestTitle(r)}
                </div>
                <div className="text-sm text-gray-600">Solicitado por: {r.requestedBy}</div>
                <div className="text-sm text-gray-500">
                  {r.status} • {new Date(r.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
            {requests.length === 0 && !loading && <li className="text-sm text-gray-600">No hay solicitudes.</li>}
          </ul>
        </div>

        {/* Columna derecha ahora solo muestra un breve mensaje (o puede quedar vacía) */}
        <div className="col-span-2">
          <div className="border p-4 rounded h-full">
            <p className="text-sm text-gray-600">Selecciona una solicitud de la lista para ver detalles en un pop-up.</p>
          </div>
        </div>
      </div>

      {/* MODAL — muestra detalles en pop-up */}
      {showModal && selected && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center sm:items-center items-start p-4 z-50 overflow-auto">
          <div className="bg-white p-6 rounded-lg w-full max-w-3xl shadow-xl max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-semibold mb-2">Solicitud #{selected.id}</h3>

            <div className="mb-2">Tipo: <strong>{getReadableType(selected.type)}</strong></div>
            <div className="mb-2">PollId: <strong>{selected.pollId}</strong></div>
            <div className="mb-2">Nombre elección: <strong>{selected.payload?.title || titleMap[selected.pollId] || "—"}</strong></div>
            <div className="mb-2">Solicitado por: <strong>{selected.requestedBy}</strong></div>
            <div className="mb-2">Estado: <strong>{selected.status}</strong></div>
            {selected.adminComment && <div className="mb-2"><strong>Comentario admin:</strong> {selected.adminComment}</div>}
            <div className="mb-4 text-sm text-gray-500">Creado: {new Date(selected.createdAt).toLocaleString()}</div>

            {selected.payload && (
              <>
                <h4 className="font-semibold mt-3">Datos propuestos</h4>
                <div className="mb-2"><strong>Título:</strong> {selected.payload.title}</div>
                <div className="mb-2"><strong>Opciones:</strong></div>
                <ul>
                  {Array.isArray(selected.payload.options) ? selected.payload.options.map((o, i) => (
                    <li key={i} className="border p-2 mb-2">
                      <div className="font-semibold">{o.text}</div>
                      {o.description && <div className="text-sm text-gray-600">{o.description}</div>}
                      {o.imageUrl && <img src={o.imageUrl} alt="" className="w-24 h-24 object-cover mt-2 border" />}
                    </li>
                  )) : <li>No hay opciones</li>}
                </ul>
              </>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              {/* Si la solicitud está pendiente y el usuario es superadmin, mostrar aprobar/rechazar */}
              {selected.status === "pending" && role === "superadmin" && (
                <>
                  <button onClick={() => approve(selected.id)} className="bg-green-600 text-white px-4 py-2 rounded">Aprobar</button>
                  <button onClick={() => rejectReq(selected.id)} className="bg-red-600 text-white px-4 py-2 rounded">Rechazar</button>
                </>
              )}

              {/* Si ya procesada o si es editor, mostrar sólo info y cerrar */}
              {selected.status !== "pending" && (
                <div className="text-sm text-gray-600 self-center">Solicitud {selected.status}.</div>
              )}

              <button onClick={() => { setShowModal(false); setSelected(null); }} className="px-4 py-2 border rounded">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
