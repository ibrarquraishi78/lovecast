/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'float-up': {
          '0%': { transform: 'translate(-50%, 0) scale(0.8)', opacity: '1' },
          '50%': { opacity: '0.9' },
          '100%': { transform: 'translate(-50%, -220px) scale(1.4)', opacity: '0' },
        },
      },
      animation: {
        'float-up': 'float-up 2s ease-out forwards',
      },
    },
  },
  plugins: [],
}