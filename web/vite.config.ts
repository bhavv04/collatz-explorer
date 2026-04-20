import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    fs: { allow: ['..'] }
  },
  optimizeDeps: {
    exclude: ['engine']
  },
  build: {
    target: 'esnext'
  }
})