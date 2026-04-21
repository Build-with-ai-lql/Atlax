module.exports = {
  root: true,
  ignorePatterns: ['**/.next/**', '**/node_modules/**', '**/coverage/**', '**/dist/**', '**/out/**'],
  settings: {
    next: {
      rootDir: ['apps/web/'],
    },
  },
  overrides: [
    {
      files: ['apps/web/**/*.ts', 'apps/web/**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: ['./apps/web/tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      plugins: ['@typescript-eslint'],
      extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      },
    },
    {
      files: ['packages/domain/src/**/*.ts', 'packages/domain/tests/**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: ['./packages/domain/tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      plugins: ['@typescript-eslint'],
      extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      },
    },
  ],
}
