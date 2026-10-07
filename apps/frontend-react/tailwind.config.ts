import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
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