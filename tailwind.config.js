/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/components/**/*.{html,jsx,tsx}",
    "index.html",
    "./src/layout/*.tsx",
    "./src/pages/*.tsx",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          1:  'hsl(235, 83%, 96%)',
          2:  'hsl(235, 74%, 93%)',
          3:  'hsl(235, 62%, 88%)',
          4:  'hsl(235, 55%, 80%)',
          5:  'hsl(235, 49%, 72%)',
          6:  'hsl(245, 49%, 68%)',
          7:  'hsl(245, 49%, 62%)',
          8:  'hsl(245, 46%, 53%)',
          9:  'hsl(245, 43%, 44%)',
          10: 'hsl(245, 38%, 34%)',
          11: 'hsl(245, 38%, 20%)',
        },
        grey: {
          1: 'hsl(209, 61%, 16%)',
          2: 'hsl(211, 39%, 23%)',
          3: 'hsl(209, 34%, 30%)',
          4: 'hsl(209, 28%, 39%)',
          5: 'hsl(210, 22%, 49%)',
          6: 'hsl(209, 23%, 60%)',
          7: 'hsl(211, 27%, 70%)',
          8: 'hsl(210, 31%, 80%)',
          9: 'hsl(212, 33%, 89%)',
          10: 'hsl(210, 36%, 96%)',
          11: 'hsl(210, 40%, 98%)',
        },
      },
    },
  },
  plugins: [],
}

