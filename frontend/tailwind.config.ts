import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        bb: '1.25rem',
        'bb-lg': '1.5rem',
      },
      colors: {
        bb: {
          cream: '#FAF6EF',
          surface: '#FFFDF8',
          ink: '#33413C',
          'ink-soft': '#5E6E68',
          teal: '#4FA98F',
          'teal-deep': '#2E6F5E',
          sand: '#EADFCB',
          coral: '#E8A08D',
          sky: '#C7DDEA',
          highlight: '#F6E3B4',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
