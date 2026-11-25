/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: { navy: '#0E2680', royal: '#1D3FB4', gold: '#F6B800', brick: '#D1232A', mist: '#F3F5FB' },
      fontFamily: { display: ['"Baloo 2"', 'system-ui', 'sans-serif'], sans: ['Nunito', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
