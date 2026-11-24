import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Plan mục 0.2 (v7): Tone Engine đóng băng — không UI nào dùng. `@nom/core` vẫn re-export cho
 * script content, nên chặn theo tên export + chặn import thẳng vào thư mục `tone/`.
 */
const FROZEN_TONE = {
  paths: [
    {
      name: '@nom/core',
      importNames: [
        'computeTone',
        'TONE_RULES',
        'inherentFinal',
        'consonantClass',
        'MID_CONSONANTS',
        'HIGH_CONSONANTS',
        'LOW_CONSONANTS',
        'LEADING_FOLLOWERS',
        'HO_NAM_FOLLOWERS',
        'O_NAM_FOLLOWERS',
      ],
      message: 'Tone Engine đóng băng ở v7 (plan mục 0.2) — apps/web không dùng.',
    },
  ],
  patterns: [
    {
      group: ['@nom/core/src/**', '**/core/src/tone', '**/core/src/tone/**'],
      message: 'Chỉ import @nom/core; Tone Engine đóng băng ở v7 (plan mục 0.2).',
    },
  ],
};

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/dist-speaking/**',
      '**/node_modules/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'tools/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // AGENTS.md mục 7: Firebase chỉ qua AuthService; tiến độ học không dùng localStorage.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'firebase/auth', message: 'Chỉ gọi Firebase qua AuthService (src/auth).' },
            ...FROZEN_TONE.paths,
          ],
          patterns: FROZEN_TONE.patterns,
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: 'Dữ liệu người dùng chỉ qua repository (Dexie).' },
      ],
    },
  },
  {
    // AGENTS.md mục 7: logic thuần, không React (DOM đã bị chặn bằng tsconfig lib).
    files: ['packages/core/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-*', 'react/*'], message: 'packages/core không dùng React.' },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/src/auth/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', FROZEN_TONE] },
  },
  {
    files: ['apps/web/e2e/**/*.ts', 'apps/web/*.ts'],
    rules: { 'no-restricted-imports': ['error', FROZEN_TONE] },
  },
  {
    // shadcn/ui sinh ra — giữ nguyên để dễ cập nhật.
    files: ['apps/web/src/components/ui/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  prettier,
);
