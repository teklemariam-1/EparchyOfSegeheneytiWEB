import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import nextPlugin from '@next/eslint-plugin-next'

/**
 * Flat ESLint config (ESLint 9).
 *
 * Previously this file exported `[]` while the real rules sat in a legacy
 * .eslintrc.json that ESLint 9 ignored — so `npm run lint` enforced nothing.
 * eslint-config-next's core-web-vitals still relies on @rushstack/eslint-patch,
 * which is incompatible with flat config, so we don't extend it here; instead we
 * run the TypeScript parser with the project's own rules. All are warnings, so
 * lint surfaces issues without failing CI on the existing `as any` usage.
 */
export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'src/migrations/**',
      'src/app/(payload)/**',
      'src/types/payload-types.ts',
      'next-env.d.ts',
      '**/*.config.{js,cjs,mjs,ts}',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    plugins: { '@typescript-eslint': tsPlugin, '@next/next': nextPlugin },
    rules: {
      // Register Next's recommended rules (resolves inline disable directives
      // for @next/next/* and catches real Next pitfalls). The raw plugin is
      // flat-config-safe; only eslint-config-next's shareable config is not.
      ...nextPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      '@typescript-eslint/no-require-imports': 'warn',
      'no-unused-vars': 'off',
    },
  },
]
