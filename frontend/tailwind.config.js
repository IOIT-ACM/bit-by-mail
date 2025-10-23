/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        background: {
          base: "#0a0a0a",
        },
        text: {
          primary: "rgba(255, 255, 255, 0.9)",
          secondary: "rgba(255, 255, 255, 0.6)",
          tertiary: "rgba(255, 255, 255, 0.5)",
        },
        surface: {
          card: "rgba(40, 40, 52, 0.4)",
          header: "rgba(0, 0, 0, 0.5)",
          element: "rgba(0, 0, 0, 0.2)",
          "element-hover": "rgba(0, 0, 0, 0.3)",
        },
        borders: {
          primary: "rgba(255, 255, 255, 0.1)",
          secondary: "rgba(255, 255, 255, 0.2)",
        },
        status: {
          success: {
            text: "#4ade80",
            bg: "rgba(34, 197, 94, 0.1)",
            border: "rgba(34, 197, 94, 0.2)",
          },
          danger: {
            text: "#f87171",
            bg: "rgba(239, 68, 68, 0.1)",
            border: "rgba(239, 68, 68, 0.2)",
          },
          info: {
            text: "#60a5fa",
            bg: "rgba(59, 130, 246, 0.1)",
            border: "rgba(59, 130, 246, 0.2)",
          },
        },
        accent: {
          green: "#22c55e",
          blue: "#3b82f6",
          orange: "#f97316",
        },
      },
      borderRadius: {
        card: "24px",
        button: "9999px",
      },
      boxShadow: {
        card: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
        fab: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
      },
      fontSize: {
        "heading-1": "1.875rem",
        "heading-2": "1.5rem",
        "heading-3": "1.25rem",
        body: "1rem",
        label: "0.875rem",
        caption: "0.75rem",
      },
      backdropBlur: {
        xl: "24px",
      },
      keyframes: {
        pulse: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
