module.exports = {
  extends: ['./.eslintrc.cjs'],
  env: {
    jest: true,
    'cypress/globals': true,
  },
  plugins: ['jest-dom', 'testing-library', 'cypress'],
  rules: {
    // Jest-specific rules
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
    
    // Testing Library rules
    'testing-library/await-async-query': 'error',
    'testing-library/no-await-sync-query': 'error',
    'testing-library/no-debugging-utils': 'warn',
    'testing-library/no-dom-import': 'error',
    'testing-library/prefer-screen-queries': 'error',
    'testing-library/prefer-user-event': 'error',
    
    // Cypress rules
    'cypress/no-assigning-return-values': 'error',
    'cypress/no-unnecessary-waiting': 'error',
    'cypress/assertion-before-screenshot': 'warn',
    'cypress/no-force': 'warn',
    
    // Allow console in tests
    'no-console': 'off',
    
    // Allow any in test files for mocking
    '@typescript-eslint/no-explicit-any': 'off',
    
    // Allow non-null assertions in tests
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
  overrides: [
    {
      files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
      rules: {
        // Test-specific overrides
        'max-lines': 'off',
        'max-lines-per-function': 'off',
      },
    },
    {
      files: ['cypress/**/*.{ts,tsx}'],
      rules: {
        // Cypress-specific overrides
        'import/no-extraneous-dependencies': 'off',
      },
    },
    {
      files: ['**/*.stories.{ts,tsx}'],
      rules: {
        // Storybook-specific overrides
        'import/no-extraneous-dependencies': 'off',
        'react-hooks/rules-of-hooks': 'off',
      },
    },
  ],
};