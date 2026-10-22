/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0B1220",
        sidebar: "#111827",
        card: "#1E293B",
        primary: "#3B82F6",
        accent: "#06B6D4",
        textPrimary: "#F8FAFC",
        textSecondary: "#94A3B8",
        border: "#334155",
      },
    },
  },
  plugins: [],
};
