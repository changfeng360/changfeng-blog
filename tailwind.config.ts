import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1d1d1f",
          soft: "#6e6e73",
          faint: "#86868b",
        },
        paper: "#f5f5f7",
        accent: {
          blue: "#0071e3",
          mint: "#6ed3b6",
          tangerine: "#ff9f0a",
          pink: "#ff375f",
          lilac: "#bf5af2",
          gold: "#f0a500",
        },
        pixel: {
          ink: "#171a1f",
          slate: "#3a3f4b",
          cream: "#f7f2e7",
          cyan: "#22d3ee",
          gold: "#fbbf24",
          red: "#ef4444",
          green: "#22c55e",
          pink: "#f472b6",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Segoe UI",
          "PingFang SC",
          "Microsoft YaHei",
          "sans-serif",
        ],
        mono: [
          "SF Mono",
          "Cascadia Code",
          "JetBrains Mono",
          "Consolas",
          "monospace",
        ],
        pixel: [
          "Press Start 2P",
          "Zpix",
          "SF Mono",
          "Cascadia Code",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        "apple-sm":
          "0 1px 2px rgba(0,0,0,.03), 0 2px 8px rgba(0,0,0,.04)",
        apple:
          "0 2px 6px rgba(0,0,0,.04), 0 12px 32px rgba(0,0,0,.08), 0 32px 80px rgba(0,0,0,.05)",
        "apple-hover":
          "0 8px 20px rgba(0,0,0,.06), 0 24px 64px rgba(0,0,0,.12), 0 40px 96px rgba(0,0,0,.07)",
        "apple-inset":
          "inset 0 1px 0 rgba(255,255,255,.75), inset 0 -1px 0 rgba(0,0,0,.04)",
        pixel: "4px 4px 0 rgba(23,26,31,.9)",
        "pixel-sm": "2px 2px 0 rgba(23,26,31,.9)",
      },
      keyframes: {
        "blink-cursor": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "pixel-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "pixel-wiggle": {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        "wave-eq": {
          "0%, 100%": { transform: "scaleY(.35)" },
          "50%": { transform: "scaleY(1)" },
        },
        "marquee-pixel": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "typing-paw": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(2px)" },
        },
        "blink-eye": {
          "0%, 92%, 100%": { transform: "scaleY(1)" },
          "95%": { transform: "scaleY(.1)" },
        },
        "float-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "album-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "blink-cursor": "blink-cursor 1s step-end infinite",
        "pixel-bounce": "pixel-bounce 1.6s ease-in-out infinite",
        "pixel-wiggle": "pixel-wiggle 2.4s ease-in-out infinite",
        "wave-eq": "wave-eq 800ms ease-in-out infinite",
        "marquee-pixel": "marquee-pixel 22s linear infinite",
        "typing-paw": "typing-paw 420ms ease-in-out infinite",
        "blink-eye": "blink-eye 4.2s ease-in-out infinite",
        "float-soft": "float-soft 3.2s ease-in-out infinite",
        "album-spin": "album-spin 7s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
