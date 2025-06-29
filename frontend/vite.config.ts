import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://10.0.0.69:8000',
        changeOrigin: true,
        // при необходимости убираем префикс:
        rewrite: path => path.replace(/^\/api/, '/api'),
      },
    },
  },


})
