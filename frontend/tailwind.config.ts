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
        brand: {
          dark: "#05050A",
          surface: "#0D0E15",
          highlight: "#181A26",
          primary: "#D4367A",
          secondary: "#7A34C4",
          text: "#F8F8F9",
          muted: "#888995"
        },
        "spotify-green": "#1db954",
        "spotify-black": "#000000",
        "spotify-dark-grey": "#121212",
        "spotify-grey": "#181818",
        "spotify-light-grey": "#282828",
        "spotify-hover-grey": "#2a2a2a",
        "spotify-text-muted": "#b3b3b3"
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(to right, #D4367A, #7A34C4)',
        'hero-overlay': 'linear-gradient(to top, rgba(5,5,10,1) 0%, rgba(5,5,10,0) 100%)',
      },
      boxShadow: {
        player: "0 -12px 40px rgba(0, 0, 0, 0.6)"
      }
    }
  },
  plugins: []
};

export default config;
