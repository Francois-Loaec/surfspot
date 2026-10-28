import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.BASE_PATH || '/surfspot/',
  plugins: [react()],
  server: {
    proxy: {
      // Le navigateur appelle Vite ; Vite transmet cette requête à Express.
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
