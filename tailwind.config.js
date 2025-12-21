/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9', // Fallback
          900: '#0f4c81', // Japan Blue (Kachi-iro ish)
          DEFAULT: '#0f4c81',
        },
        sakura: {
          100: '#fce7f3', // Pink-100
          500: '#ec4899', // Pink-500
        },
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          800: '#292524',
          900: '#1c1917',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
