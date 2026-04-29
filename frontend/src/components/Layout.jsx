import React from "react";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      {/* HEADER */}
      <header className="bg-indigo-700 text-white shadow-lg">
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-6 xl:px-10 py-4 flex items-center justify-between">

          <h1 className="text-lg md:text-2xl font-semibold tracking-wide">
            Sistema de Votaciones - UNAH
          </h1>

        </div>
      </header>

      {/* CONTENIDO */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto px-4 md:px-6 xl:px-10 py-6">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-6 xl:px-10 py-4 text-center text-sm">
          © KR31 - AEIA-UNAHVS 2025
        </div>
      </footer>

    </div>
  );
}