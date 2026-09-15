/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#EDEAE2',
        paperDark: '#E2DDD0',
        ink: '#221F1C',
        inkMuted: '#5B5445',
        rule: '#CBC3B0',
        rust: '#B8452D',
        danger: '#A3291B',
      },
      fontFamily: {
        display: ["'Fraunces'", "Georgia", "serif"],
        body: ["'IBM Plex Sans'", "-apple-system", "sans-serif"],
        mono: ["'IBM Plex Mono'", "'Courier New'", "monospace"],
      },
    },
  },
  plugins: [],
};
