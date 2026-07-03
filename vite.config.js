import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteApiPlugin } from './vite-api-plugin'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isDev = command === 'serve';
  return {
    plugins: [
      react(),
      isDev && viteApiPlugin()
    ].filter(Boolean),
    server: {
      host: true,
    }
  };
})

