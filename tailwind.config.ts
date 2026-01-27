import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        sand: '#f7f3ee',
        clay: '#d7c2ad',
        moss: '#2f5d50',
        sun: '#f6c453'
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif']
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.12)'
      }
    }
  },
  plugins: []
};

export default config;
