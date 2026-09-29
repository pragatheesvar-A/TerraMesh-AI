/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mine: {
          bg: '#0B0F17',
          sec: '#111827',
          panel: '#131D2E',
          elevated: '#1E293B',
          border: '#243247',
          borderSubtle: 'rgba(255, 255, 255, 0.08)',
          borderBright: 'rgba(6, 182, 212, 0.35)',
        },
        industrial: {
          cyan: '#06B6D4',
          amber: '#F59E0B',
          orange: '#F97316',
          red: '#EF4444',
          green: '#10B981',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#CBD5E1',
          muted: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'panel': '0 4px 12px 0 rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'panel-hover': '0 6px 20px -2px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(6, 182, 212, 0.4)',
        'cyan-sm': '0 0 14px -2px rgba(6, 182, 212, 0.35)',
        'amber-sm': '0 0 14px -2px rgba(245, 158, 11, 0.35)',
        'danger-sm': '0 0 16px -2px rgba(239, 68, 68, 0.4)',
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'beacon': 'beacon 1.8s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        beacon: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.4)', opacity: '0.4' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      }
    },
  },
  plugins: [],
}
