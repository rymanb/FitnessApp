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
        background: '#000000',   
        surface: {
          DEFAULT: '#27272a',    
          light: '#3f3f46',     
          dark: '#18181b',
        },
        text: {
          DEFAULT: '#ffffff',  
          muted: '#a1a1aa',  
          dark: '#52525b'
        }
      }
    },
  },
  plugins: [],
};