/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#f0b90b', // Dorado Binance
          dark: '#d4a30a',
        },
        secondary: {
          DEFAULT: '#212121',
          light: '#2b2b2b',
        },
        background: '#1e2023',
        success: '#0ecb81',
        danger: '#f6465d',
        warning: '#f1c40f',
      }
    },
  },
  plugins: [],
}
