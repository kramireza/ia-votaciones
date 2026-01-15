import React, { useState, useEffect } from "react";
import api from "../services/api";
import { getRoleFromToken } from "../services/auth";

export default function ElectionsPanel({ token }) {
  const [elections, setElections] = useState([]);

  // Para crear nueva elección
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState([{ text: "", image: null, description: "" }]);
  const [msg, setMsg] = useState(null);

  // ============================
  // 🔵 MODAL DE EDICIÓN
  // ============================
  const [editing, setEditing] = useState(null); // aquí guardaremos la elección a editar
  const [editTitle, setEditTitle] = useState("");
  const [editOptions, setEditOptions] = useState([]);

  // rol desde token
  const role = getRoleFromToken(token);

  // CARGAR ELECCIONES
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.getElections(token);
        setElections(res.data);
      } catch (err) {
        console.error("Error cargando elecciones:", err);
      }
    }
    fetchData();
  }, [token]);

  // ============================
  // 🔵 OPCIONES DINÁMICAS CREACIÓN
  // ============================

  function addOption() {
    setOptions([...options, { text: "", image: null, description: "" }]);
  }

  function updateOption(i, field, value) {
    const updated = [...options];
    updated[i][field] = value;
    setOptions(updated);
  }

  function removeOption(i) {
    const updated = options.filter((_, index) => index !== i);
    setOptions(updated);
  }

  // ============================
  // 🔵 CREAR NUEVA ELECCIÓN
  // ============================
  async function createElection(e) {
    e.preventDefault();

    const formattedOptions = options.map((o) => ({
      text: o.text,
      image: o.image ? o.image.name : null,
      description: o.description && o.description.trim() !== "" ? o.description : null
    }));

    const formData = new FormData();
    formData.append("title", title);
    formData.append("options", JSON.stringify(formattedOptions));

    options.forEach((o) => {
      if (o.image) formData.append("images", o.image);
    });

    try {
      await api.createElection(formData, token);
      setMsg({ type: "success", text: "Elección creada correctamente." });

      setTitle("");
      setOptions([{ text: "", image: null, description: "" }]);

      const res = await api.getElections(token);
      setElections(res.data);

    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Error creando elección." });
    }
  }

  // ============================
  // 🔵 CAMBIAR ESTADO
  // ============================
  async function toggleStatus(election) {
    const newStatus = election.status === "open" ? "closed" : "open";

    try {
      await api.updateElectionStatus(election.pollId, newStatus, token);

      const res = await api.getElections(token);
      setElections(res.data);

    } catch (err) {
      console.error(err);
    }
  }

  // ============================
  // 🔵 ELIMINAR ELECCIÓN (o solicitar eliminación si editor)
  // ============================
  async function deleteElection(pollId) {
    if (!confirm("¿Seguro que quieres eliminar esta elección?")) return;

    try {
      if (role === "editor") {
        // Preferimos usar la ruta de solicitudes si está disponible
        if (api.requestDeleteElection) {
          await api.requestDeleteElection(pollId, token);
          alert("Solicitud enviada: el superadmin recibirá la petición para aprobar la eliminación.");
        } else {
          // Fallback informativo: no romper nada si backend no tiene la ruta
          alert("Solicitud enviada localmente. (Nota: tu backend no expone 'requestDeleteElection'. Añade la ruta /approvals para flujo completo.)");
        }
      } else {
        // superadmin o admin real -> eliminar directamente
        await api.deleteElection(pollId, token);
        alert("Elección eliminada.");
      }

      const res = await api.getElections(token);
      setElections(res.data);
    } catch (err) {
      console.error(err);
      alert("Error procesando petición.");
    }
  }

  // ============================================================
  // 🔵 ABRIR MODAL CON DATOS DE LA ELECCIÓN A EDITAR
  // ============================================================
  function openEditModal(election) {
    setEditing(election);
    setEditTitle(election.title);
    setEditOptions(election.options.map(o => ({
      text: o.text || "",
      imageUrl: o.imageUrl || null,
      newImage: null,
      description: o.description || ""
    })));
  }

  // ============================================================
  // 🔵 ACTUALIZAR OPCIONES EDITADAS
  // ============================================================
  function updateEditOption(i, field, value) {
    const updated = [...editOptions];
    updated[i][field] = value;
    setEditOptions(updated);
  }

  function addEditOption() {
    setEditOptions([...editOptions, { text: "", imageUrl: null, newImage: null, description: "" }]);
  }

  function removeEditOption(i) {
    const updated = editOptions.filter((_, index) => index !== i);
    setEditOptions(updated);
  }

  // ============================================================
  // 🔵 GUARDAR CAMBIOS DESDE EL MODAL (aplica o solicita según rol)
  // ============================================================
  async function saveEditChanges() {
    const formData = new FormData();
    formData.append("title", editTitle);

    const formatted = editOptions.map(o => ({
      text: o.text,
      imageUrl: o.imageUrl || null,
      newImage: o.newImage ? o.newImage.name : null,
      description: o.description && o.description.trim() !== "" ? o.description : null
    }));

    formData.append("options", JSON.stringify(formatted));

    editOptions.forEach(o => {
      if (o.newImage) formData.append("images", o.newImage);
    });

    try {
      if (role === "editor") {
        // Enviar solicitud de edición si la ruta existe
        if (api.requestEditElection) {
          await api.requestEditElection(editing.pollId, formData, token);
          alert("Solicitud de edición enviada: el superadmin debe aprobar los cambios.");
        } else {
          alert("Solicitud enviada localmente. (Nota: tu backend no expone 'requestEditElection'. Añade la ruta /approvals para flujo completo.)");
        }
        setEditing(null); // cerrar modal sin aplicar cambios
      } else {
        // superadmin -> aplicar inmediatamente (comportamiento actual)
        await api.editElection(editing.pollId, formData, token);

        const res = await api.getElections(token);
        setElections(res.data);

        setEditing(null); // cerrar modal
      }
    } catch (err) {
      console.error(err);
      alert("Error guardando cambios.");
    }
  }

  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-bold">Gestión de Elecciones</h2>

      {/* =====================================================
             FORMULARIO DE CREACIÓN
      ===================================================== */}
      <div className="p-4 bg-white shadow rounded-lg border">
        <h3 className="font-semibold mb-2">Crear nueva elección</h3>

        <form onSubmit={createElection} className="space-y-4">

          <input
            className="input w-full"
            placeholder="Título de la elección"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {/* OPCIONES */}
          <h4 className="font-semibold">Opciones</h4>

          {Array.isArray(options) && options.map((opt, i) => (
            <div key={i} className="border p-3 rounded-lg bg-gray-50">

              <input
                className="input w-full mb-2"
                placeholder={`Opción ${i + 1}`}
                value={opt.text}
                onChange={(e) => updateOption(i, "text", e.target.value)}
                required
              />

              <label className="block text-sm mb-1">Descripción (opcional)</label>
              <textarea
                className="w-full mb-2 input"
                placeholder="Breve descripción de la opción (opcional)"
                value={opt.description}
                onChange={(e) => updateOption(i, "description", e.target.value)}
                rows={3}
                maxLength={1000}
              />

              <input
                type="file"
                accept="image/*"
                onChange={(e) => updateOption(i, "image", e.target.files[0])}
                className="mb-2"
              />

              {options.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addOption}
            className="bg-green-600 text-white px-3 py-1 rounded"
          >
            + Agregar opción
          </button>

          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg block w-full">
            Crear elección
          </button>
        </form>

        {msg && (
          <p className={`mt-3 ${msg.type === "error" ? "text-red-600" : "text-green-600"}`}>
            {msg.text}
          </p>
        )}
      </div>

      {/* =====================================================
                LISTA DE ELECCIONES
      ===================================================== */}
      <div className="bg-white p-4 shadow rounded-lg border">
        <h3 className="font-semibold mb-2">Elecciones existentes</h3>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">pollId</th>
              <th className="p-2">Título</th>
              <th className="p-2">Estado</th>
              <th className="p-2">Opciones</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {elections.map((e) => (
              <tr key={e.pollId} className="border-b">
                <td className="p-2">{e.pollId}</td>
                <td className="p-2">{e.title}</td>
                <td className="p-2">
                  <span className={e.status === "open" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                    {e.status}
                  </span>
                </td>

                <td className="p-2">
                  {Array.isArray(e.options)
                    ? e.options.map((o) => o.text).join(", ")
                    : "Sin opciones"}

                </td>

                <td className="p-2 space-x-2">
                  <button
                    onClick={() => toggleStatus(e)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded"
                  >
                    {e.status === "open" ? "Cerrar" : "Abrir"}
                  </button>

                  <button
                    onClick={() => openEditModal(e)}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => deleteElection(e.pollId)}
                    className={`px-3 py-1 rounded ${role === "editor" ? "bg-orange-500 text-white" : "bg-red-600 text-white"}`}
                  >
                    {role === "editor" ? "Solicitar eliminación" : "Eliminar"}
                  </button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* =====================================================
                MODAL PARA EDITAR (mejorado para scroll)
      ===================================================== */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center sm:items-center items-start p-4 z-50 overflow-auto">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] overflow-auto">

            <h2 className="text-xl font-semibold mb-4">
              Editar elección: {editing.pollId}
            </h2>

            <label className="font-semibold">Título</label>
            <input
              className="input w-full mb-3"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />

            <h3 className="font-semibold mb-2">Opciones</h3>

            {Array.isArray(editOptions) && editOptions.map((opt, i) => (
              <div key={i} className="border p-3 rounded-lg mb-3 bg-gray-50">

                <input
                  className="input w-full mb-2"
                  value={opt.text}
                  onChange={(e) =>
                    updateEditOption(i, "text", e.target.value)
                  }
                />

                <label className="block text-sm mb-1">Descripción (opcional)</label>
                <textarea
                  className="w-full mb-2 input"
                  placeholder="Breve descripción de la opción (opcional)"
                  value={opt.description}
                  onChange={(e) =>
                    updateEditOption(i, "description", e.target.value)
                  }
                  rows={3}
                  maxLength={1000}
                />

                {opt.imageUrl && (
                  <img
                    src={opt.imageUrl}
                    className="w-24 h-24 object-cover rounded mb-2 border"
                  />
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    updateEditOption(i, "newImage", e.target.files[0])
                  }
                  className="mb-2"
                />

                {editOptions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEditOption(i)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addEditOption}
              className="bg-green-600 text-white px-3 py-1 rounded mb-3"
            >
              + Agregar opción
            </button>

            {/* BOTONES */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 border rounded"
              >
                Cancelar
              </button>

              <button
                onClick={saveEditChanges}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                {role === "editor" ? "Solicitar aprobación" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
