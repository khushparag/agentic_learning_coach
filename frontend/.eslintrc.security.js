module.exports = {
  extends: [
    './.eslintrc.cjs',
    'plugin:security/recommended',
    'plugin:no-secrets/recommended'
  ],
  plugins: [
    'security',
    'no-secrets'
  ],
  rules: {
    // Security-focused rules
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    
    // Secrets detection
    'no-secrets/no-secrets': ['error', {
      'tolerance': 4.2,
      'additionalRegexes': {
        'Basic Auth': 'Basic [A-Za-z0-9+/=]+',
        'Bearer Token': 'Bearer [A-Za-z0-9\\-\\._~\\+\\/]+=*',
        'JWT Token': 'eyJ[A-Za-z0-9\\-\\._~\\+\\/]+=*',
        'API Key': '[Aa][Pp][Ii]_?[Kk][Ee][Yy].*[\'|"][0-9a-zA-Z]{32,45}[\'|"]',
        'AWS Access Key': 'AKIA[0-9A-Z]{16}',
        'AWS Secret Key': '[\'|"][0-9a-zA-Z\\/+]{40}[\'|"]',
        'GitHub Token': 'ghp_[0-9a-zA-Z]{36}',
        'Slack Token': 'xox[baprs]-[0-9]{12}-[0-9]{12}-[0-9a-zA-Z]{24}',
        'Private Key': '-----BEGIN [A-Z]+ PRIVATE KEY-----'
      }
    }],
    
    // Additional security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-inline-comments': 'off', // Allow inline comments for security annotations
    
    // React security rules
    'react/no-danger': 'error',
    'react/no-danger-with-children': 'error',
    'react/jsx-no-script-url': 'error',
    'react/jsx-no-target-blank': ['error', { 
      'allowReferrer': false,
      'enforceDynamicLinks': 'always'
    }],
    
    // TypeScript security rules
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error'
  },
  
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        // Relax some security rules for tests
        'security/detect-non-literal-regexp': 'off',
        'no-secrets/no-secrets': 'off'
      }
    },
    {
      files: ['**/*.stories.ts', '**/*.stories.tsx'],
      rules: {
        // Relax some security rules for Storybook stories
        'no-secrets/no-secrets': 'off'
      }
    }
  ]
};