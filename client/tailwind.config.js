/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cinematic: {
          dark: '#08090C',
          card: '#12151B',
          surface: '#1A1E26',
          border: '#282E3C',
          accent: '#E50914',
          accentHover: '#FF2E4D',
          gold: '#F5C518',
          textMuted: '#94A3B8',
          textLight: '#F1F5F9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(229, 9, 20, 0.4)',
        'glow-gold': '0 0 25px -5px rgba(245, 197, 24, 0.3)',
      }
    },
  },
  plugins: [],
}
