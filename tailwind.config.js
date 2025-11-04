/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/react-app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nueva paleta RIVALVERSO
        'rivalverso-black': '#000000',
        'rivalverso-white': '#FFFFFF',
        'rivalverso-purple-dark': '#3e099f',
        'rivalverso-purple-light': '#891fd3',
        'rivalverso-green': '#58d129',
        // Colores adicionales para degradados y variaciones
        'rivalverso-purple-gradient-start': '#891fd3',
        'rivalverso-purple-gradient-end': '#3e099f',
        'rivalverso-green-light': '#6fe83f',
        'rivalverso-green-dark': '#45b020',
      },
      fontFamily: {
        'sans': ['Helvetica Neue', 'Helvetica', 'Inter', 'system-ui', 'Avenir', 'Arial', 'sans-serif'],
        'helvetica-neue': ['Helvetica Neue', 'Helvetica', 'sans-serif'],
        'bebas': ['Helvetica Neue', 'Helvetica', 'sans-serif'],
        'montserrat': ['Helvetica Neue', 'Helvetica', 'sans-serif'],
        'oswald': ['Helvetica Neue', 'Helvetica', 'sans-serif'],
        'rivalverso-heading': ['Helvetica Neue', 'Helvetica', 'sans-serif'],
        'rivalverso-body': ['Helvetica Neue', 'Helvetica', 'sans-serif'],
      },
      scale: {
        '102': '1.02',
      },
      borderWidth: {
        '3': '3px',
      },
      boxShadow: {
        'rivalverso-purple': '0 0 12px rgba(137, 31, 211, 0.6)',
        'rivalverso-green': '0 0 12px rgba(88, 209, 41, 0.6)',
        'rivalverso-purple-dark': '0 0 12px rgba(62, 9, 159, 0.6)',
      }
    },
  },
  plugins: [],
};
