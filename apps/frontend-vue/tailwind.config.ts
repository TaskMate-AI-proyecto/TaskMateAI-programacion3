import type { Config } from 'tailwindcss'

// Mismos colores de marca que la app React: el sistema visual es compartido.
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#14213d',
        canvas: '#f7f5ef',
        coral: '#ef6f5e',
        mint: '#4b9b84',
      },
    },
  },
  plugins: [],
} satisfies Config
