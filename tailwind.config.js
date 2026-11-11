/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Burgundy theme palette (from the family dashboard reference)
        burg: {
          50: '#fbf5f6',
          100: '#f5e7ea',
          200: '#ebd1d7',
          300: '#dbaeb9',
          400: '#c47f8f',
          500: '#a95a6e',
          600: '#8e4257',
          700: '#752f45',
          800: '#5d1f33',
          900: '#4a1728',
          950: '#330c19',
        },
        cream: '#faf7f2',
        gold: {
          300: '#e6c98a',
          400: '#d9b46a',
          500: '#c99a4e',
        },
      },
      fontFamily: {
        serif: ['"Iowan Old Style"', '"Palatino"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
