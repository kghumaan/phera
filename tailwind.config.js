/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-work-sans)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['var(--font-instrument-serif)', 'Georgia', 'serif'],
      },
      colors: {
        // Cultural colors matching your M3 theme
        gold: '#D4AF37',
        maroon: '#800020',
        saffron: '#FF9933',
        coral: '#FF6B6B',
        teal: '#20C997',
        purple: '#6C5CE7',
      },
    },
  },
  plugins: [],
} 