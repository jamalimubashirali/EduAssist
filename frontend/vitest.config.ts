import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    timeout: 30000,
    // Skip CSS processing for tests
    css: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Exclude CSS and other non-JS files from processing
  esbuild: {
    target: 'node14'
  }
})