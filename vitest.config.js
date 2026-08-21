import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
  }
})
