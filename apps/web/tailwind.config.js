/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'], content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: { extend: {
    borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 1px)', sm: 'calc(var(--radius) - 2px)' },
    colors: { background: '#040404', foreground: '#F3F5F3', deep: '#0A0B0A', elevated: '#0F1110', graphite: '#141815', card: { DEFAULT: '#0F1110', foreground: '#F3F5F3' }, popover: { DEFAULT: '#0A0B0A', foreground: '#F3F5F3' }, primary: { DEFAULT: '#9CFF2E', foreground: '#040404' }, secondary: { DEFAULT: '#141815', foreground: '#F3F5F3' }, muted: { DEFAULT: '#141815', foreground: '#A2AAA1' }, accent: { DEFAULT: '#141815', foreground: '#F3F5F3' }, destructive: { DEFAULT: '#FF5E5E', foreground: '#F3F5F3' }, border: { DEFAULT: '#1C211D', strong: '#283129' }, input: '#1C211D', ring: '#9CFF2E', secondarytext: '#A2AAA1', mutedtext: '#70786F' },
    fontFamily: { heading: ['var(--font-heading)'], body: ['var(--font-body)'], display: ['var(--font-display)'], mono: ['var(--font-mono)'] },
    keyframes: { 'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } }, 'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } } }, animation: { 'accordion-down': 'accordion-down 0.2s ease-out', 'accordion-up': 'accordion-up 0.2s ease-out' }
  } }, plugins: [require('tailwindcss-animate')]
};
