import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        sand: '#f4f2ec',
        clay: '#d8d4ca',
        moss: '#176b5b',
        sun: '#f3c84b',
        signal: '#c9483e',
        night: '#0b1220'
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif']
      },
      boxShadow: {
        soft: '0 18px 50px rgba(15, 23, 42, 0.08)',
        lift: '0 24px 80px rgba(8, 15, 28, 0.16)'
      }
    }
  },
  plugins: []
};

export default config;
