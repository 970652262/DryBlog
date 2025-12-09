/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5faff",
          100: "#e0f0ff",
          200: "#b9dcff",
          300: "#8ac3ff",
          400: "#3d99f5",
          500: "#0c61e2",
          600: "#0849b4",
          700: "#073d93",
          800: "#062f70",
          900: "#052452",
        },
        neutral: {
          50: "#f8f9fa",
          100: "#f1f3f5",
          200: "#e9ecef",
          300: "#dee2e6",
          400: "#ced4da",
          500: "#adb5bd",
          600: "#868e96",
          700: "#495057",
          800: "#343a40",
          900: "#212529",
        },
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(4px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: 0.4 },
          "50%": { opacity: 1 },
        },
        scaleIn: {
          "0%": { opacity: 0, transform: "scale(.95)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
      },
      animation: {
        fadeIn: "fadeIn .4s ease-out",
        pulseSoft: "pulseSoft 3s ease-in-out infinite",
        scaleIn: "scaleIn .25s ease-out",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 4px 24px -6px rgba(0,0,0,0.15)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.04)",
      },
      borderRadius: {
        xl: "1rem",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
