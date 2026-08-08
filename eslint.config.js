// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/*',
      'node_modules/*',
      '*.config.js',
      'scripts/**/*',
      '.expo/*',
      'prototypes/**/*',
    ],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      'react-hooks': require('eslint-plugin-react-hooks'),
      'react-native': require('eslint-plugin-react-native'),
      security: require('eslint-plugin-security'),
      'eslint-comments': require('@eslint-community/eslint-plugin-eslint-comments'),
    },
    rules: {
      // === TypeScript Rules for AI Type Safety ===
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': 'allow-with-description',
          'ts-nocheck': true, // Completely banned - no bypassing type checking
          'ts-expect-error': 'allow-with-description',
          'ts-check': false,
          minimumDescriptionLength: 25,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],

      // === Code Robustness - NO BYPASSES ALLOWED ===
      'eslint-comments/no-unlimited-disable': 'error',
      'eslint-comments/no-unused-disable': 'error',
      'eslint-comments/no-use': ['error', { allow: [] }], // Ban ALL disable comments
      'eslint-comments/require-description': 'error',

      // === React Hooks Rules for AI React Patterns ===
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // === React Native Specific Rules ===
      'react-native/no-unused-styles': 'error',
      'react-native/split-platform-components': 'warn',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-color-literals': 'warn',
      'react-native/no-raw-text': 'off', // Allow raw text in components

      // === Security Rules for AI Vulnerabilities ===
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',

      // === Import Rules for AI Import Issues ===
      // The dependency graph of docs/guides/project-structure.md §3. Each new
      // domain under src/modules adds a zone forbidding the other domains.
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            { target: './src/lib', from: './src' },
            { target: './src/constants', from: './src' },
            {
              target: './src/modules',
              from: ['./src/app', './src/components', './src/hooks'],
            },
            { target: './src/components', from: './src/app' },
            // `archive` is the one module that legitimately spans domains: an
            // export file has to hold all of them at once.
            // A foreign key needs the referenced table object, and a
            // `schema.ts` is inert shape with no logic, so it is the one file
            // of another domain a schema may reach for.
            {
              target: './src/modules/notes',
              from: './src/modules',
              except: [
                './notes',
                './types',
                './db',
                './archive',
                './folders/schema.ts',
              ],
            },
            {
              target: './src/modules/app-icon',
              from: './src/modules',
              except: ['./app-icon', './types'],
            },
            {
              target: './src/modules/palette',
              from: './src/modules',
              except: ['./palette', './types', './db'],
            },
            {
              target: './src/modules/settings',
              from: './src/modules',
              except: ['./settings', './types', './db', './archive'],
            },
            {
              target: './src/modules/haptics',
              from: './src/modules',
              except: ['./haptics', './settings'],
            },
            {
              target: './src/modules/types',
              from: './src/modules',
              except: ['./types'],
            },
          ],
        },
      ],
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',
      'import/no-useless-path-segments': 'error',
      'import/no-duplicates': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-namespace': 'error',
      // NOTE: import/order is handled by Prettier with @trivago/prettier-plugin-sort-imports
      // 'import/order': [
      //   'error',
      //   {
      //     groups: [
      //       'builtin',
      //       'external',
      //       'internal',
      //       'parent',
      //       'sibling',
      //       'index',
      //     ],
      //     'newlines-between': 'always',
      //     alphabetize: {
      //       order: 'asc',
      //       caseInsensitive: true,
      //     },
      //     warnOnUnassignedImports: true,
      //   },
      // ],

      // === Core JavaScript Rules for AI Code Quality ===
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      // Conflicts with consistent-type-imports; import/no-duplicates covers it.
      'no-duplicate-imports': 'off',
      'no-magic-numbers': [
        'warn',
        {
          ignore: [-1, 0, 1, 2],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
        },
      ],
      complexity: ['warn', { max: 25 }],
      'max-depth': ['warn', { max: 4 }],
      'max-lines-per-function': ['warn', { max: 150, skipBlankLines: true }],
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',
      'prefer-template': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',

      // === Performance Rules for AI Performance Issues ===
      'no-await-in-loop': 'error',
      'no-return-await': 'error',
      'prefer-promise-reject-errors': 'error',

      // === Consistency Rules for AI Code Style ===
      camelcase: ['error', { properties: 'never', ignoreDestructuring: true }],
      'consistent-return': 'error',
      curly: ['error', 'all'],
      'dot-notation': 'error',
      'no-else-return': 'error',
      'no-lonely-if': 'error',
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-destructuring': [
        'error',
        {
          array: false,
          object: true,
        },
      ],

      // === React Specific Rules for AI React Issues ===
      // Note: Most React rules are already handled by expo-eslint-config

      // === Memory Leak Prevention for AI Async Patterns ===
      'no-async-promise-executor': 'error',
      'require-atomic-updates': 'error',
    },
  },
  {
    // React Compiler's purity rules assume no direct mutation outside
    // render; Reanimated's useSharedValue API is built entirely on
    // mutating .value from gesture/event callbacks, which these rules
    // can't distinguish from an actual bug. `'use no memo'` doesn't
    // suppress them in this plugin version, so they're disabled here.
    files: ['src/components/highlights/HighlightList.tsx'],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);
