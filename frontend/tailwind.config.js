/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(ellipse at top, var(--tw-gradient-stops))',
        'gradient-aurora':
          'linear-gradient(135deg, #6366f1 0%, #a855f7 35%, #ec4899 70%, #f59e0b 100%)',
        'mesh-light':
          'radial-gradient(at 20% 10%, rgba(99,102,241,0.18) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(168,85,247,0.15) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(236,72,153,0.12) 0px, transparent 50%)',
        'mesh-dark':
          'radial-gradient(at 20% 10%, rgba(99,102,241,0.22) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(168,85,247,0.18) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(236,72,153,0.15) 0px, transparent 50%)',
      },
      boxShadow: {
        soft: '0 4px 30px rgba(0, 0, 0, 0.08)',
        glow: '0 0 40px rgba(99, 102, 241, 0.4)',
        'glow-lg': '0 0 80px rgba(99, 102, 241, 0.35)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'gradient-x': 'gradient-x 8s ease infinite',
      },
    },
  },
  plugins: [],
};
