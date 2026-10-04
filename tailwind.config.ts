import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#1d1d1f',
        sand: '#f5f5f7',
        clay: '#e5e5ea',
        moss: '#176b5b',
        sun: '#ffd60a',
        signal: '#ff453a',
        night: '#0f172a'
      },
      fontFamily: {
        serif: ['ui-serif', '"New York"', 'Georgia', 'serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Segoe UI"', 'sans-serif']
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 18px 48px rgba(15, 23, 42, 0.07)',
        lift: '0 24px 70px rgba(8, 15, 28, 0.14)'
      }
    }
  },
  plugins: []
};

export default config;
