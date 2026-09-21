/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mpesa: {
          green: '#4CAF50',
          dark: '#1B5E20',
          light: '#81C784',
          accent: '#00C853',
        },
      },
    },
  },
  plugins: [],
};
