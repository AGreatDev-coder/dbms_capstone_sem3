/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F5F2EB',
        surface: '#FBFAF6',
        ink: '#1C1B18',
        muted: '#6B675E',
        rule: '#D9D4C7',
        blood: {
          DEFAULT: '#A4161A',
          hover: '#851215',
          soft: '#F0DAD6',
        },
        moss: '#3F6B4F',
        ochre: '#B7791F',
        slate: '#3C4A57',
        // Backward-compat aliases if needed during migration
        brand: {
          50: '#fef2f2',
          100: '#F0DAD6',
          500: '#A4161A',
          600: '#A4161A',
          700: '#851215',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Fraunces', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '2px',
        md: '3px',
        lg: '4px',
      },
    },
  },
  plugins: [],
}
