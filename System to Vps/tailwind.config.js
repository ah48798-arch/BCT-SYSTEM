/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bct: {
          navy: '#154568',
          dark: '#10354F',
          deep: '#0B2436',
          surface: '#F5F7FA',
          muted: '#687787',
          line: '#E2E8F0',
          teal: '#1F6F8B',
          accent: '#2A9D8F',
          gold: '#E9A23B',
          purple: '#7B5EA7',
          success: '#1D5A3A',
          warning: '#D97706',
          critical: '#C8553D',
        }
      },
      fontFamily: {
        sans: ['Cairo', 'Segoe UI', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
