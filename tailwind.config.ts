import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          50: '#fbf7f6',
          100: '#f5eeec',
          200: '#ebd9d5',
          300: '#dbbab2',
          400: '#c59286',
          500: '#b17163',
          600: '#9e5a4d',
          700: '#84493e',
          800: '#6e3f37',
          900: '#5c3831',
          950: '#321b17',
        },
        brand: {
          red: '#FF0033',
          dark: '#0A0D14',
          card: '#121722',
          cardHover: '#181F2E',
          border: '#222938',
          accent: '#FF3366',
          purple: '#8B5CF6',
          cyan: '#06B6D4',
          amber: '#F59E0B',
          emerald: '#10B981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 35px -5px rgba(255, 0, 51, 0.25)',
        'glow-purple': '0 0 35px -5px rgba(139, 92, 246, 0.25)',
        'glow-cyan': '0 0 35px -5px rgba(6, 182, 212, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
