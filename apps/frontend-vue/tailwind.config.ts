import type { Config } from 'tailwindcss'

// Escala slate por variables CSS: index.css la invierte en tema claro (:root) y la deja estándar en .dark.
const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
const slate = Object.fromEntries(shades.map((shade) => [shade, `rgb(var(--slate-${shade}) / <alpha-value>)`]))

// Mismos colores de marca que la app React: el sistema visual es compartido.
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        // Acento de la app: estas escalas leen variables que Ajustes cambia (applyAccent en settings.ts).
        indigo: {
          50: 'rgb(var(--indigo-50) / <alpha-value>)',
          300: 'rgb(var(--indigo-300) / <alpha-value>)',
          400: 'rgb(var(--indigo-400) / <alpha-value>)',
          500: 'rgb(var(--indigo-500) / <alpha-value>)',
          600: 'rgb(var(--indigo-600) / <alpha-value>)',
          700: 'rgb(var(--indigo-700) / <alpha-value>)',
          950: 'rgb(var(--indigo-950) / <alpha-value>)',
        },
        violet: {
          500: 'rgb(var(--violet-500) / <alpha-value>)',
          600: 'rgb(var(--violet-600) / <alpha-value>)',
        },
        slate,
        // Color de vidrio: blanco en oscuro, azul marino en claro (bordes y velos translúcidos).
        glass: 'rgb(var(--glass-rgb) / <alpha-value>)',
        ink: '#14213d',
        canvas: '#f7f5ef',
        coral: '#ef6f5e',
        mint: '#4b9b84',
      },
      // Animaciones compartidas con la app React: entrada de paneles y halo de los iconos de acceso.
      keyframes: {
        // Hoja diagonal "verso": cruza la tarjeta de izquierda a derecha (o al revés) con skewX(-20deg).
        'blade-right': {
          '0%': { transform: 'translateX(-150%) skewX(-20deg)' },
          '100%': { transform: 'translateX(250%) skewX(-20deg)' },
        },
        'blade-left': {
          '0%': { transform: 'translateX(250%) skewX(-20deg)' },
          '100%': { transform: 'translateX(-150%) skewX(-20deg)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.7' },
          '70%': { transform: 'scale(2.4)', opacity: '0' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
      },
      animation: {
        'blade-right': 'blade-right 0.7s ease-in-out forwards',
        'blade-left': 'blade-left 0.7s ease-in-out forwards',
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.22, 1, 0.36, 1) infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
