import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFF7FB", // soft pink paper
        peach: "#F8CFE3", // pink accent surfaces
        rosewood: "#E85D9E", // main pink
        lavender: "#CBB9F6", // header bars
        ink: "#3A2A33",
      },
      fontFamily: {
        thai: ['"Noto Sans Thai"', '"IBM Plex Thai"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
