export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Montserrat", "sans-serif"],
        body: ["Open Sans", "sans-serif"],
      },
      colors: {
        brandRed: "#D62828",
        charcoal: "#1A1A1A",
        accentBlack: "#333333",
        softGrey: "#F2F2F2",
        pureWhite: "#FFFFFF",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(26, 26, 26, 0.08)",
        card: "0 10px 24px rgba(26, 26, 26, 0.06)",
      },
    },
  },
  plugins: [],
};