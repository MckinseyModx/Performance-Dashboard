/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "-apple-system", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ['"Source Serif 4"', "Georgia", "Cambria", "serif"],
      },
      colors: {
        mck: {
          navy: "#051C2C",
          blue: "#2251FF",
          teal: "#00A9CE",
          gold: "#F2A900",
          red: "#E34850",
          green: "#00875A",
          gray: {
            50: "#F4F3F1",
            100: "#E8EDF2",
            200: "#D1D9E0",
            400: "#B3B8C4",
            600: "#6B7280",
            800: "#333333",
          },
        },
      },
    },
  },
  plugins: [],
};
