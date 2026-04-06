/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'd4-bg': '#0a0a0a',
        'd4-surface': '#1a1a1a',
        'd4-border': '#2a2a2a',
        'd4-accent': '#b8860b',
        'd4-accent-hover': '#daa520',
        'd4-text': '#e5e5e5',
        'd4-text-dim': '#a0a0a0',
      }
    },
  },
  plugins: [],
};