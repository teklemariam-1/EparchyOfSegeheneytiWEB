import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Allow explicit `any` with a comment — Payload types sometimes require it
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow unused vars prefixed with _ (common pattern)
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Payload admin may use require() in generated importMap
      '@typescript-eslint/no-require-imports': 'warn',
    },
  },
]

export default config
