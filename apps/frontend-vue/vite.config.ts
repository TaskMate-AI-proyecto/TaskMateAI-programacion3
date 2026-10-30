import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Puerto fijo: si está ocupado Vite falla en vez de cambiar de puerto (strictPort).
export default defineConfig({
  plugins: [vue()],
  server: {
    host: 'localhost',
    port: 5174,
    strictPort: true,
  },
  preview: {
    host: 'localhost',
    port: 5174,
    strictPort: true,
  },
})
