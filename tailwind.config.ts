import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 18px 50px rgba(15, 23, 42, 0.22)",
      },
      colors: {
        parchment: "#f4e8cb",
        ink: "#20150d",
        ember: "#b64d24",
        pine: "#1f4a3d",
        dusk: "#1d2a44",
      },
    },
  },
  plugins: [],
};

export default config;
