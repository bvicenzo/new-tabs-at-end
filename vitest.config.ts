import { defineConfig } from 'vitest/config';

const COVERED_SOURCES = ['src/**', 'eslint-plugin-vicenzo/rules/**', 'eslint-plugin-vicenzo/utils/**'];

export default defineConfig({
  test: {
    globals: true,
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**'],
    setupFiles: ['./test/setup/context.ts'],
    restoreMocks: true,
    unstubGlobals: true,
    passWithNoTests: true,
    coverage: { provider: 'v8', include: COVERED_SOURCES }
  }
});
