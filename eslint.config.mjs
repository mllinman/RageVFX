import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2022,
      },
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      // TypeScript-specific rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_', 
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      
      // General code quality rules
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'log'] }],
      'prefer-const': 'warn',
      'no-var': 'error',
      'eqeqeq': ['warn', 'always', { null: 'ignore' }],
    },
  },
  {
    ignores: [
      'dist/**', 
      'dist-web/**',
      'release/**',
      'node_modules/**', 
      'ui/**/*.js', 
      'web/**/*.js',
      'marketing/**/*.js',
      'build/**',
      'examples/**/*.js',
    ],
  }
);
