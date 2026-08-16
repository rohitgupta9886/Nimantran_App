/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: '#FAF7F3',
          soft: '#FFFDFC',
          sand: '#EDE4DC',
        },
        blush: {
          DEFAULT: '#D8B5B0',
          mist: '#F2E5E2',
          rose: '#E9D3D0',
          dark: '#9E6F6D',
        },
        champagne: {
          DEFAULT: '#C9AA78',
          soft: '#E4D1AD',
          dark: '#997A48',
        },
        espresso: {
          DEFAULT: '#302829',
          charcoal: '#51484A',
          muted: '#8C7E80',
        },
        royal: {
          dark: '#302829',
          burgundy: '#9E6F6D',
          red: '#704E4D',
          gold: '#C9AA78',
          goldLight: '#E4D1AD',
          cream: '#FFFDFC',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Playfair Display', 'Cinzel', 'serif'],
        sans: ['Manrope', 'Inter', 'sans-serif'],
        hindi: ['Rozha One', 'serif'],
      },
    },
  },
  plugins: [],
}
