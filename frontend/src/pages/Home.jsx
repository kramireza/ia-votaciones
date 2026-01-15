import React, { useState, useEffect } from "react";
import StudentVerify from "./StudentVerify";
import AdminLogin from "./AdminLogin";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

/* ============================================================
   🔵 BOTÓN ADMIN OCULTO — SE ACTIVA CON Ctrl + Shift + A
   ============================================================ */
function HotkeyAdminButton({ onShow }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
        setVisible(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!visible) return null;

  return (
    <button
      className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded"
      onClick={onShow}
    >
      Acceso Administrador
    </button>
  );
}

/* ============================================================
   🔵 COMPONENTE PRINCIPAL
   ============================================================ */
export default function Home({ onVerified, onAdminLogin }) {
  const [showAdmin, setShowAdmin] = useState(false);
  const navigate = useNavigate();

  // 🔵 LOGIN ADMIN
  function handleAdminLoginSuccess(token) {
    onAdminLogin(token);
    navigate("/admin");
  }

  // 🔵 VERIFICACIÓN ESTUDIANTE
  async function handleStudentVerified(studentData) {
    onVerified(studentData);

    try {
      const res = await api.getActiveElection();
      const active = res.data;

      if (active) {
        navigate("/votar");
      } else {
        alert("No hay una elección activa en este momento.");
      }
    } catch (err) {
      console.error(err);
      alert("Error buscando elección activa.");
    }
  }

  return (
    <div className="container mx-auto py-10 space-y-10">
      
      {/* Verificación Estudiante */}
      <div className="max-w-xl mx-auto">
        <StudentVerify onVerified={handleStudentVerified} />
      </div>

      {/* Información general */}
      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow border">
        <h2 className="text-xl font-semibold mb-2">Información</h2>
        <p className="text-gray-600 text-sm">
          Bienvenido al sistema de votaciones UNAH.  
          Los estudiantes pueden verificar su cuenta para participar en elecciones activas.
        </p>
      </div>

      {/* Login Admin — oculto hasta que se activa con Ctrl + Shift + A */}
      <div className="max-w-xl mx-auto text-center">

        {!showAdmin ? (
          <>
            {/* BOTÓN OCULTO */}
            <HotkeyAdminButton onShow={() => setShowAdmin(true)} />
          </>
        ) : (
          <div className="bg-white p-6 rounded shadow border">
            <h3 className="text-lg font-semibold mb-2">Login Admin</h3>
            <AdminLogin onLogin={handleAdminLoginSuccess} />
          </div>
        )}
      </div>

    </div>
  );
}
