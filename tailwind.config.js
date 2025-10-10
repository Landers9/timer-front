/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#FFF9E6",
          100: "#FFF3CC",
          200: "#FFE799",
          300: "#FFDB66",
          400: "#FFCF33",
          500: "#FFC300",
          600: "#CC9C00",
          700: "#997500",
          800: "#664E00",
          900: "#332700",
        },
        dark: {
          50: "#F7F7F7",
          100: "#E3E3E3",
          200: "#C8C8C8",
          300: "#A4A4A4",
          400: "#818181",
          500: "#666666",
          600: "#515151",
          700: "#434343",
          800: "#383838",
          900: "#1A1A1A",
        },
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem", // 4px
        sm: "0.125rem", // 2px
        md: "0.375rem", // 6px
        lg: "0.5rem", // 8px
      },
    },
  },
  plugins: [],
};
