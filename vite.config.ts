import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  server: {
    allowedHosts: ['armrest-cameo-tucking.ngrok-free.dev'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
  plugins: [
    vue(),
  ],
  base: '/',
})
