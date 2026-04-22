import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  plugins: [tsconfigPaths()],
})
