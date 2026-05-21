import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/privacy-image-redactor/',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'verification', '.chrome-redactor-test'],
  },
})
