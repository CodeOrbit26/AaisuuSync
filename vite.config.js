import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteApiPlugin } from './vite-api-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), viteApiPlugin()],
  server: {
    host: true,
  }
})

