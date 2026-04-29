import React, {
  useEffect,
  useState
} from "react";

export default function Layout({
  children
}) {
  const [darkMode, setDarkMode] =
    useState(false);

  useEffect(() => {
    const saved =
      localStorage.getItem(
        "theme"
      );

    const isDark =
      saved === "dark";

    setDarkMode(
      isDark
    );

    if (isDark) {
      document.documentElement.classList.add(
        "dark"
      );
    } else {
      document.documentElement.classList.remove(
        "dark"
      );
    }
  }, []);

  function toggleTheme() {
    const next =
      !darkMode;

    setDarkMode(next);

    localStorage.setItem(
      "theme",
      next
        ? "dark"
        : "light"
    );

    if (next) {
      document.documentElement.classList.add(
        "dark"
      );
    } else {
      document.documentElement.classList.remove(
        "dark"
      );
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-100 via-white to-indigo-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100 transition-colors duration-300">

      {/* HEADER */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b shadow-sm dark:bg-slate-900/80 dark:border-slate-800">
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-6 xl:px-10 py-4 flex items-center justify-between gap-4">

          {/* BRAND */}
          <div className="flex items-center gap-3 min-w-0">

            <div className="w-11 h-11 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white grid place-items-center text-lg font-black shadow-lg shrink-0">
              🗳️
            </div>

            <div className="min-w-0">
              <h1 className="text-base md:text-2xl font-black tracking-tight truncate">
                Sistema de Votaciones
              </h1>

              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 truncate">
                UNAH • Plataforma Electoral Digital
              </p>
            </div>

          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-2">

            <button
              onClick={
                toggleTheme
              }
              className="px-4 py-2 rounded-xl border bg-white hover:bg-slate-50 text-sm font-semibold shadow-sm transition dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
              title="Cambiar tema"
            >
              {darkMode
                ? "☀️ Claro"
                : "🌙 Oscuro"}
            </button>

          </div>

        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto px-4 md:px-6 xl:px-10 py-6 md:py-8">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="border-t bg-white/70 backdrop-blur-xl dark:bg-slate-900/70 dark:border-slate-800">
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-6 xl:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-sm">

          <div className="text-slate-600 dark:text-slate-400 text-center md:text-left">
            © KR31 - AEIA-UNAHVS 2025
          </div>

          <div className="text-slate-500 dark:text-slate-500 text-center md:text-right">
            Plataforma segura para procesos electorales estudiantiles
          </div>

        </div>
      </footer>

    </div>
  );
}