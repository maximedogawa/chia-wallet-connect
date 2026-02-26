import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/node_modules/**',
      '**/*.d.ts',
      '**/coverage/**',
      '**/*.config.{js,mjs,cjs}',
      '**/next.config.*',
      '**/postcss.config.*',
      '**/tailwind.config.*',
      '**/public/**',
      '**/demo/**',
      '**/test.ts',
      '**/examples/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'max-lines': ['error', { max: 1000, skipBlankLines: true, skipComments: true }],
      'no-console': 'error',
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      'no-useless-return': 'error',
      'no-useless-concat': 'error',
      'no-iterator': 'error',
      'no-restricted-syntax': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          args: 'none',
        },
      ],
    },
  },
  {
    files: ['**/utils/walletIntegration/**/*.{ts,tsx}', '**/redux/**/*.{ts,tsx}', '**/api.tsx', '**/components/**/walletIntegration/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
)
