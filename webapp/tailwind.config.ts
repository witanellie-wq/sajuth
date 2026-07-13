import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF7F0",
        peach: "#F7D9C4",
        rosewood: "#8C5B5B",
        ink: "#3A2E2E",
      },
      fontFamily: {
        thai: ['"Noto Sans Thai"', '"IBM Plex Thai"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
