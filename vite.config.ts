import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxying the /config.js request during development
      // to the backend server that serves the API key.
      '/config.js': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    }
  }
})
