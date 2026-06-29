import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-firago)', 'FiraGO', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        brand: {
          DEFAULT: '#22c55e',
          dark: '#16a34a',
        },
        workout: { DEFAULT: '#f97316', dark: '#ea580c', light: '#fed7aa' },
        progress: { DEFAULT: '#3b82f6', dark: '#2563eb', light: '#dbeafe' },
        chat: { DEFAULT: '#8b5cf6', dark: '#7c3aed', light: '#ede9fe' },
        calendar: { DEFAULT: '#14b8a6', dark: '#0f766e', light: '#ccfbf1' },
      },
      boxShadow: {
        'glow-green': '0 4px 20px rgba(34, 197, 94, 0.4), 0 1px 6px rgba(34, 197, 94, 0.2)',
        'glow-green-sm': '0 2px 12px rgba(34, 197, 94, 0.3)',
        'glow-green-lg': '0 8px 40px rgba(34, 197, 94, 0.45), 0 2px 12px rgba(34, 197, 94, 0.25)',
        'glow-red': '0 4px 20px rgba(239, 68, 68, 0.4)',
        'card-hover': '0 4px 24px rgba(0, 0, 0, 0.07)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out both',
        'slide-up': 'slideUp 0.4s ease-out both',
        'scale-in': 'scaleIn 0.3s ease-out both',
        'float': 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(34,197,94,0.25), 0 0 20px rgba(34,197,94,0.1)' },
          '50%': { boxShadow: '0 0 20px rgba(34,197,94,0.55), 0 0 40px rgba(34,197,94,0.25)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
