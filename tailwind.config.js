/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: {
          950: '#0b0e14',
          900: '#121722',
          850: '#171d2b',
          800: '#1e2637',
          700: '#2a3547',
        },
        ink: {
          100: '#f1f5f9',
          300: '#c3cddd',
          400: '#94a3b8',
          500: '#64748b',
        },
        accent: {
          DEFAULT: '#6366f1',
          soft: '#818cf8',
          glow: '#22d3ee',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
