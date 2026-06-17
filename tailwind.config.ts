import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#162033',
        surface: '#f7f8fb',
        gain: '#0f8f64',
        loss: '#cf3f44',
      },
      boxShadow: {
        soft: '0 12px 30px rgba(22, 32, 51, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config;
