import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: 'all', // Permite cualquier host (o lista específica)
  },
  server: {
    host: true, // Opcional pero recomendado
  }
})
