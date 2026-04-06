/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          light: '#60a5fa',
          dark: '#1d4ed8',
        },
        background: 'var(--background)',
        surface: {
          DEFAULT: 'var(--surface)',
          light: 'var(--surface-light)',
          dark: 'var(--surface-dark)',
        },
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
          dark: 'var(--text-dark)',
        },
        card: {
          DEFAULT: 'var(--card)',
          light: 'var(--card-light)',
          dark: 'var(--card-dark)',
        },
        modal: {
          DEFAULT: 'var(--modal)',
        },
      },
    },
  },
  plugins: [],
};
