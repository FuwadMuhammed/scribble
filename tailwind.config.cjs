/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        hand: ["Patrick Hand", "ui-rounded", "system-ui", "sans-serif"],
        modal: ["Caveat", "Patrick Hand", "ui-rounded", "system-ui", "sans-serif"],
      },
      boxShadow: {
        note: "0 8px 20px rgba(0,0,0,0.08)",
        modal: "0 20px 50px rgba(0,0,0,0.15)",
        prompt: "0 10px 30px rgba(0,0,0,0.25)",
        float: "0 10px 25px rgba(0,0,0,0.18)",
      },
    },
  },
  plugins: [],
}
