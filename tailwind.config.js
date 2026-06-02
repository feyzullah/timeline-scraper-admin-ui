/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      colors: {
        surface: {
          950: '#0c0a09',
          900: '#12100e',
          850: '#1a1714',
          800: '#221e1a',
          700: '#2c2620',
          600: '#3d342c'
        },
        accent: {
          DEFAULT: '#fbbf24',
          dim: '#f59e0b',
          glow: '#fde68a'
        }
      },
      boxShadow: {
        panel: '0 0 0 1px rgba(251, 191, 36, 0.08), 0 24px 48px -12px rgba(0,0,0,0.55)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.04)'
      }
    }
  },
  plugins: []
};
