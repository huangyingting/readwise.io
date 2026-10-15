import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        reader: {
          bg: 'var(--reader-bg)',
          sidebar: 'var(--reader-sidebar)',
          border: 'var(--reader-border)',
          text: 'var(--reader-text)',
          muted: 'var(--reader-muted)',
          accent: '#3b82f6',
          highlight: 'rgba(250, 204, 21, 0.35)',
        }
      }
    },
  },
  plugins: [],
};
export default config;
