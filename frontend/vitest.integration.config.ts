import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    timeout: 60000, // Longer timeout for integration tests
    // Disable CSS processing for tests
    css: false,
    // Only include integration test files
    include: ['src/tests/**/*.test.ts'],
    // Exclude files that might cause issues
    exclude: ['node_modules/**', 'dist/**', '.next/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Optimize for Node.js testing environment
  esbuild: {
    target: 'node14',
    format: 'esm'
  },
  // Don't process CSS or other assets
  assetsInclude: [],
})