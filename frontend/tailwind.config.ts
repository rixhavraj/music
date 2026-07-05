import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#000000",
        paper: "#121212",
        copper: "#1db954",
        moss: "#2f6f5e",
        lagoon: "#246a73",
        plum: "#6c4a7f",
        "spotify-green": "#1db954",
        "spotify-black": "#000000",
        "spotify-dark-grey": "#121212",
        "spotify-grey": "#181818",
        "spotify-light-grey": "#282828",
        "spotify-hover-grey": "#2a2a2a",
        "spotify-text-muted": "#b3b3b3"
      },
      boxShadow: {
        player: "0 -12px 40px rgba(0, 0, 0, 0.6)"
      }
    }
  },
  plugins: []
};

export default config;
