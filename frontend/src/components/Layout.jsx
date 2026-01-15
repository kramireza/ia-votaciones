import React from "react";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      {/* HEADER */}
      <header className="bg-indigo-700 text-white py-4 shadow">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-semibold">
            Sistema de Votaciones - UNAH
          </h1>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 text-center py-4 text-sm">
        © KR31 - AEIA-UNAHVS 2025
      </footer>
    </div>
  );
}
