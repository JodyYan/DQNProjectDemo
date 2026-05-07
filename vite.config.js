import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    proxy: {
      '/twse-api': {
        target: 'https://openapi.twse.com.tw',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/twse-api/, '')
      },
      '/mis-api': {
        target: 'https://mis.twse.com.tw',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mis-api/, '')
      }
    }
  }
})
