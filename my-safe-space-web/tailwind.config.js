/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        owl: {
          DEFAULT: "#58cc02",
          pressed: "#58a700",
          mint: "#a5ed6e",
          soft: "#d7ffb8",
        },
        macaw: "#1cb0f6",
        cardinal: "#ff4b4b",
        fox: "#ff9600",
        bee: "#ffc800",
        beetle: "#ce82ff",
        ink: {
          DEFAULT: "#042c60",
          deep: "#100f3e",
          blue: "#000437",
        },
        "body": "#3c3c3c",
        "body-strong": "#4b4b4b",
        "body-muted": "#777777",
        "body-soft": "#afafaf",
        hairline: "#e5e5e5",
        canvas: "#FAFAFD",
      },
      fontFamily: {
        feather: ["Nunito", "ui-rounded", "Segoe UI", "system-ui", "sans-serif"],
        din: ["Quicksand", "ui-rounded", "Segoe UI", "system-ui", "sans-serif"],
      },
      borderRadius: {
        btn: "16px",
      },
      boxShadow: {
        lip: "0 4px 0 #58a700",
        "lip-sm": "0 3px 0 #58a700",
        card: "0 1px 0 rgba(0,0,0,0.04)",
      },
      letterSpacing: {
        btn: "0.8px",
      },
      transitionTimingFunction: {
        bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
}