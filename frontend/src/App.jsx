import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import Home from "./pages/Home";
import VotingPage from "./pages/VotingPage";
import AdminDashboard from "./pages/AdminDashboard";
import PublicResults from "./pages/PublicResults";

export default function App() {
  const [student, setStudent] = useState(() => {
    const data = localStorage.getItem("voting_student");
    return data ? JSON.parse(data) : null;
  });

  const [adminToken, setAdminToken] = useState(
    localStorage.getItem("admin_token") || null
  );

  // ==========================================================
  // ESTUDIANTE
  // ==========================================================
  function handleVerified(studentData) {
    setStudent(studentData);
    localStorage.setItem("voting_student", JSON.stringify(studentData));
  }

  function handleStudentLogout() {
    setStudent(null);
    localStorage.removeItem("voting_student");
  }

  // ==========================================================
  // ADMIN
  // ==========================================================
  function handleAdminLogin(token) {
    setAdminToken(token);
    localStorage.setItem("admin_token", token);
  }

  function handleAdminLogout() {
    setAdminToken(null);
    localStorage.removeItem("admin_token");
  }

  return (
    <BrowserRouter basename="/votaciones">
      <Layout>
        <Routes>

          {/* ================================================== */}
          {/* HOME */}
          {/* ================================================== */}
          <Route
            path="/"
            element={
              <Home
                onVerified={handleVerified}
                onAdminLogin={handleAdminLogin}
              />
            }
          />

          {/* ================================================== */}
          {/* VOTAR */}
          {/* ================================================== */}
          <Route
            path="/votar"
            element={
              student ? (
                <VotingPage
                  student={student}
                  onVoted={() =>
                    setTimeout(() => handleStudentLogout(), 5000)
                  }
                />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* ================================================== */}
          {/* RESULTADOS PÚBLICOS */}
          {/* ================================================== */}
          <Route
            path="/resultados"
            element={<PublicResults />}
          />

          {/* ================================================== */}
          {/* ADMIN */}
          {/* ================================================== */}
          <Route
            path="/admin"
            element={
              adminToken ? (
                <AdminDashboard
                  token={adminToken}
                  onLogout={handleAdminLogout}
                />
              ) : (
                <Navigate to="/" />
              )
            }
          />

        </Routes>
      </Layout>
    </BrowserRouter>
  );
}