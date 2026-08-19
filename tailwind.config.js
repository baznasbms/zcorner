module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        go: {
          50:  '#effdf5',
          100: '#d9fbe8',
          200: '#b3f5d1',
          300: '#6beaab',
          400: '#22d481',
          500: '#00aa5b',
          600: '#008f4a',
          700: '#007540',
          800: '#005c32',
          900: '#06351f',
        },
      },
      boxShadow: {
        glow:   '0 8px 40px rgba(0,170,91,.30)',
        'glow-sm': '0 4px 20px rgba(0,170,91,.20)',
        card:   '0 2px 16px rgba(0,0,0,.07)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #00aa5b 0%, #007540 60%, #06351f 100%)',
      },
      animation: {
        'pulse-badge': 'pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'slide-up': 'slideUp .3s ease-out',
        'fade-in': 'fadeIn .25s ease-out',
        'bounce-in': 'bounceIn .4s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%':   { opacity: '0', transform: 'scale(.85)' },
          '60%':  { transform: 'scale(1.04)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
