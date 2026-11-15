import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Tiêu chí nghiệm thu M2: tone engine & normalize ≥ 90%.
      include: ['src/tone/**/*.ts', 'src/thai/normalize.ts'],
      exclude: ['**/*.test.ts'],
      thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 },
      reporter: ['text-summary', 'html'],
    },
  },
});
