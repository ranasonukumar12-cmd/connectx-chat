/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#7c3aed", dark: "#5b21b6", light: "#a78bfa" },
        accent: { DEFAULT: "#06b6d4", dark: "#0e7490" },
        surface: { DEFAULT: "#1e1b4b", card: "#16213e", dark: "#0f0e17" },
        glass: "rgba(255,255,255,0.05)",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        display: ["'Syne'", "system-ui"],
      },
      backdropBlur: { xs: "2px" },
      animation: {
        "fade-in": "fadeIn 0.3s ease",
        "slide-up": "slideUp 0.3s ease",
        "pulse-dot": "pulseDot 1.5s infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp: { "0%": { transform: "translateY(10px)", opacity: 0 }, "100%": { transform: "translateY(0)", opacity: 1 } },
        pulseDot: { "0%, 100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.3)" } },
      },
    },
  },
  plugins: [],
};
