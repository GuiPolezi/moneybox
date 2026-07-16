/** @type {import('tailwindcss').Config} */

// Cada token é uma variável CSS com um trio "R G B", então as duas paletas
// (clara e escura) trocam sozinhas e as utilidades de opacidade do Tailwind
// (bg-surface/60) continuam funcionando.
const v = (name) => `rgb(var(${name}) / <alpha-value>)`

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // superfícies
        canvas:   v('--c-canvas'),
        surface:  v('--c-surface'),
        surface2: v('--c-surface-2'),
        line:     v('--c-line'),
        line2:    v('--c-line-2'),

        // texto
        fg:       v('--c-fg'),
        muted:    v('--c-muted'),
        subtle:   v('--c-subtle'),

        // espectro aero
        brand:    v('--c-brand'),   // aqua — primária
        brand2:   v('--c-brand-2'), // ciano claro
        accent:   v('--c-accent'),  // lima/verde — energia
        sky:      v('--c-sky'),

        // semântica de dinheiro
        pos:      v('--c-pos'),
        neg:      v('--c-neg'),
        warn:     v('--c-warn'),

        // sempre-escuro/claro para texto sobre gradiente aqua
        onbrand:  v('--c-onbrand'),
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        glass:  'var(--shadow-glass)',
        lift:   'var(--shadow-lift)',
        glow:   'var(--shadow-glow)',
        inset:  'var(--shadow-inset)',
      },
      backdropBlur: {
        glass: '20px',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0) scale(1)' },
          '50%':     { transform: 'translateY(-14px) scale(1.04)' },
        },
        drift: {
          '0%':   { transform: 'translate3d(0,0,0) rotate(0deg)' },
          '100%': { transform: 'translate3d(0,0,0) rotate(360deg)' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        sheen: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        float: 'float 9s ease-in-out infinite',
        drift: 'drift 40s linear infinite',
        rise:  'rise .4s cubic-bezier(.16,1,.3,1) both',
        sheen: 'sheen 2.2s linear infinite',
      },
    },
  },
  plugins: [],
}
