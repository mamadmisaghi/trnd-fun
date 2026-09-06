/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'], content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: { extend: {
    borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 1px)', sm: 'calc(var(--radius) - 2px)' },
    colors: { background: '#080808', foreground: '#FFFFFF', deep: '#101010', elevated: '#151515', graphite: '#1A1A1A', card: { DEFAULT: '#151515', foreground: '#FFFFFF' }, popover: { DEFAULT: '#101010', foreground: '#FFFFFF' }, primary: { DEFAULT: '#A8FF00', foreground: '#080808' }, secondary: { DEFAULT: '#1A1A1A', foreground: '#FFFFFF' }, muted: { DEFAULT: '#1A1A1A', foreground: '#A9A9A9' }, accent: { DEFAULT: '#1A1A1A', foreground: '#FFFFFF' }, destructive: { DEFAULT: '#FF4D4D', foreground: '#FFFFFF' }, border: { DEFAULT: '#202020', strong: '#292929' }, input: '#202020', ring: '#A8FF00', secondarytext: '#A9A9A9', mutedtext: '#6F6F6F' },
    fontFamily: { heading: ['var(--font-heading)'], body: ['var(--font-body)'], display: ['var(--font-display)'], mono: ['var(--font-mono)'] },
    keyframes: { 'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } }, 'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } } }, animation: { 'accordion-down': 'accordion-down 0.2s ease-out', 'accordion-up': 'accordion-up 0.2s ease-out' }
  } }, plugins: [require('tailwindcss-animate')]
};
