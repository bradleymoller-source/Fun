/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // D&D themed colors
        parchment: '#f4e4bc',
        leather: '#8b4513',
        gold: '#d4af37',
        amber: '#ffbf00',
        'deep-red': '#8b0000',
        'dark-wood': '#3d2314',
      },
      fontFamily: {
        medieval: ['Cinzel', 'serif'],
      },
    },
  },
  plugins: [],
}
