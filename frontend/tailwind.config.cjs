/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",

  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],

  theme: {
    extend: {
      boxShadow: {
        soft: "0 10px 30px rgba(2,6,23,0.08)",
        glow: "0 10px 25px rgba(79,70,229,0.20)",
      },

      borderRadius: {
        xl2: "1rem",
      },

      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4,0,0.2,1)",
      },
    },
  },

  plugins: [],
};