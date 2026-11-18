import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Tiêu chí nghiệm thu M2 (tone engine, normalize), M5 (SRS, progress, repository), M7.5 (trò chơi) ≥ 90%.
      include: [
        'src/tone/**/*.ts',
        'src/thai/**/*.ts',
        'src/srs/**/*.ts',
        'src/progress/**/*.ts',
        'src/data/**/*.ts',
        'src/games/**/*.ts',
      ],
      exclude: ['**/*.test.ts', '**/*.test-utils.ts', 'src/data/contract.ts'],
      thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 },
      reporter: ['text-summary', 'html'],
    },
  },
});
