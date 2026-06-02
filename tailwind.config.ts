import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070b16',
          900: '#0a0f1f',
          850: '#0f1626',
          800: '#141c30',
        },
        accent: {
          purple: '#a855f7',
          pink: '#ec4899',
          cyan: '#22d3ee',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px -4px rgba(168, 85, 247, 0.45)',
        'glow-cyan': '0 0 20px -4px rgba(34, 211, 238, 0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out both',
        blink: 'blink 1s steps(2, start) infinite',
        'slide-in': 'slideIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
