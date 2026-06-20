/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm neutrals + gold palette (YNAB-inspired)
        cream: {
          50:  '#FEFEFE',
          100: '#FAFAF7',
          200: '#F5F3ED',
          300: '#EDE9DF',
          400: '#DDD8CC',
          500: '#C8C2B2',
        },
        gold: {
          50:  '#FDF8E7',
          100: '#FAF0C9',
          200: '#F5E096',
          300: '#EEC945',
          400: '#D4A017',
          500: '#B8860B',   // primary
          600: '#9A6E09',
          700: '#7D5807',
          800: '#604305',
          900: '#432F03',
        },
        charcoal: {
          50:  '#F7F6F4',
          100: '#ECEAE6',
          200: '#D4D0C8',
          300: '#B5B0A5',
          400: '#8F8A7D',
          500: '#6B6558',
          600: '#524E43',
          700: '#3D3A31',
          800: '#2C2921',
          900: '#1A1814',
        },
        rust: {
          400: '#E07A5F',
          500: '#C75B3F',
        },
        sage: {
          400: '#84A98C',
          500: '#6B8F72',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'warm-sm': '0 1px 3px 0 rgba(26,24,20,0.08), 0 1px 2px -1px rgba(26,24,20,0.06)',
        'warm-md': '0 4px 12px -2px rgba(26,24,20,0.10), 0 2px 6px -2px rgba(26,24,20,0.06)',
        'warm-lg': '0 10px 30px -4px rgba(26,24,20,0.12), 0 4px 10px -4px rgba(26,24,20,0.08)',
        'gold-glow': '0 0 0 3px rgba(184,134,11,0.20)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-gentle': 'bounceGentle 0.4s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceGentle: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(0.94)' },
          '70%': { transform: 'scale(1.04)' },
          '100%': { transform: 'scale(1)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(184,134,11,0)' },
          '50%': { boxShadow: '0 0 0 6px rgba(184,134,11,0.15)' },
        },
      },
    },
  },
  plugins: [],
}
