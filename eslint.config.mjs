// Lint do app. typescript-eslint strictTypeChecked: no-floating-promises pega gravação sem await
// (SQLite e arquivo). Mesmo padrão do ManiVez.
import { defineConfig, globalIgnores } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import security from 'eslint-plugin-security';
import tseslint from 'typescript-eslint';

/** @param {import('eslint').Linter.Config} c */
const rulesOnly = ({ plugins, languageOptions, ...rest }) => rest;

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/.expo/**',
    '**/android/**',
    '**/ios/**',
    '**/coverage/**',
    'dist/**',
    'docs/**',
    'legado/**',
    'playwright-report/**',
    'test-results/**',
    '**/*.config.{js,mjs,cjs}',
    '**/expo-env.d.ts',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [expoConfig, ...tseslint.configs.strictTypeChecked.map(rulesOnly)],
    rules: {
      'import/named': 'off',
      'import/namespace': 'off',
      'import/default': 'off',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          pathGroups: [
            { pattern: '@/**', group: 'internal' },
            { pattern: '@assets/**', group: 'internal' },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
    settings: {
      'import/resolver': { typescript: { project: `${import.meta.dirname}/tsconfig.json` } },
    },
  },
  {
    // Cor vem do tema (useColors/useThemedStyles); a tabela fixa só alimenta o theme.ts.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/ui/theme.ts', '**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/ui/tokens',
              importNames: ['colors'],
              message: 'Use useColors() ou useThemedStyles() de @/ui/theme-context.',
            },
          ],
          patterns: [
            {
              group: ['./tokens'],
              importNames: ['colors'],
              message: 'Use useColors() ou useThemedStyles() de ./theme-context.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [security.configs.recommended],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      'security/detect-object-injection': 'off',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
]);
