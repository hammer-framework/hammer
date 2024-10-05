//@ts-check
import babelParser from '@babel/eslint-parser'
import babelPlugin from '@babel/eslint-plugin'
import { FlatCompat } from '@eslint/eslintrc'
import eslintJs from '@eslint/js'
import * as importPlugin from 'eslint-plugin-import'
import jestDomPlugin from 'eslint-plugin-jest-dom'
import jsxA11Y from 'eslint-plugin-jsx-a11y'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import reactPlugin from 'eslint-plugin-react'
import unusedImportsPlugin from 'eslint-plugin-unused-imports'
import globals from 'globals'
import tsEslint from 'typescript-eslint'

import redwoodjsPlugin from '@redwoodjs/eslint-plugin'

const compat = new FlatCompat()

// Migrating packages/eslint-config config to flat config
const sharedConfig = tsEslint.config(
  {
    ignores: ['**/node_modules', '**/dist'],
  },
  eslintJs.configs.recommended,
  reactPlugin.configs.flat.recommended,
  eslintPluginPrettierRecommended,
  jestDomPlugin.configs['flat/recommended'],

  ...compat.plugins('react-hooks'),
  {
    plugins: {
      'unused-imports': unusedImportsPlugin,
      '@babel': babelPlugin,
      import: importPlugin,
      'jsx-a11y': jsxA11Y,
      react: reactPlugin,
      '@redwoodjs': redwoodjsPlugin,
    },

    linterOptions: {
      // Prevents unused eslint-disable comments
      reportUnusedDisableDirectives: true,
    },

    languageOptions: {
      parser: babelParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },

    settings: {
      react: {
        version: 'detect',
      },
      // For the import/order rule. Configures how it tells if an import is "internal" or not.
      // An "internal" import is basically just one that's aliased.
      //
      // See...
      // - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/order.md#groups-array
      // - https://github.com/import-js/eslint-plugin-import/blob/main/README.md#importinternal-regex
      'import/internal-regex': '^src/',
    },

    rules: {
      '@redwoodjs/process-env-computed': 'error',
      'prettier/prettier': 'warn',
      'no-console': 'off',
      'prefer-object-spread': 'warn',
      'prefer-spread': 'warn',
      'no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],
      'no-useless-escape': 'off',
      camelcase: ['warn', { properties: 'never' }],
      'no-new': 'warn',
      'new-cap': ['error', { newIsCap: true, capIsNew: false }],
      'no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
      // React rules
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          // We set this to an empty array to override the default value, which is `['builtin', 'external', 'object']`.
          // Judging by the number of issues on the repo, this option seems to be notoriously tricky to understand.
          // From what I can tell, if the value of this is `['builtin']` that means it won't sort builtins.
          // But we have a rule for builtins below (react), so that's not what we want.
          //
          // See...
          // - https://github.com/import-js/eslint-plugin-import/pull/1570
          // - https://github.com/import-js/eslint-plugin-import/issues/1565
          pathGroupsExcludedImportTypes: [],
          // Only doing this to add internal. The order here maters.
          // See https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/order.md#groups-array
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          pathGroups: [
            {
              pattern: 'react',
              group: 'builtin',
              position: 'after',
            },
            {
              pattern: '@redwoodjs/**',
              group: 'external',
              position: 'after',
            },
            {
              // Matches...
              // - src/directives/**/*.{js,ts}
              // - src/services/**/*.{js,ts}
              // - src/graphql/**/*.sdl.{js,ts}
              //
              // Uses https://github.com/isaacs/minimatch under the hood
              // See https://github.com/isaacs/node-glob#glob-primer for syntax
              pattern: 'src/*/**/*.?(sdl.){js,ts}',
              patternOptions: {
                nobrace: true,
                noglobstar: true,
              },
              group: 'internal',
              position: 'before',
            },
          ],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['$api/*'],
              message:
                'Importing from $api is only supported in *.routeHooks.{js,ts} files',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['*.tsx', '*.js', '*.jsx'],
    ignores: ['api/src/**'],
    rules: {
      'react-hooks/rules-of-hooks': 'error',
    },
  },
  {
    files: ['*.ts', '*.tsx'],
    extends: [...tsEslint.configs.recommended, eslintPluginPrettierRecommended],
    languageOptions: {
      parser: tsEslint.parser,
    },
    rules: {
      // TODO: look into enabling these eventually
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/prefer-function-type': 'off',

      // Specific 'recommended' rules we alter
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.test.*', '**/__mocks__/**'],

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.commonjs,
        ...globals.jest,
      },
    },
  },
  {
    files: [
      '.babelrc.js',
      'babel.config.js',
      '.eslintrc.js',
      '*.config.js',
      'jest.setup.js',
    ],

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.commonjs,
        ...globals.jest,
      },
    },
  },
  {
    files: [
      'web/src/**/*.routeHooks.{js,ts}',
      'web/src/entry.server.{jsx,tsx}',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },
  // Migrating packages/eslint-config/index.js to flat config
  {
    files: ['web/src/Routes.js', 'web/src/Routes.jsx', 'web/src/Routes.tsx'],
    rules: {
      'no-undef': 'off',
      'jsx-a11y/aria-role': [
        2,
        {
          ignoreNonDOM: true,
        },
      ],
      '@redwoodjs/unsupported-route-components': 'error',
    },
  },
  // `api` side
  {
    files: ['api/src/**'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2015,
        gql: 'readonly',
        context: 'readonly',
      },
    },
  },
  {
    files: ['api/src/services/**/*.ts'],
    plugins: {
      '@redwoodjs': redwoodjsPlugin,
    },
    rules: {
      '@redwoodjs/service-type-annotations': 'off',
    },
  },
  {
    files: ['api/db/seed.js', 'scripts/**'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.commonjs,
        Promise: 'readonly',
      },
    },
  },
  // `web` side
  {
    files: ['web/src/**'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2015,
        ...globals['shared-node-browser'],
        React: 'readonly',
        gql: 'readonly',
        process: 'readonly',
        require: 'readonly',
      },
    },
  },
  // Test, stories, scenarios, and mock files
  {
    files: [
      '*.test.*',
      '**/__mocks__/**',
      '*.scenarios.*',
      '*.stories.*',
      '*.mock.*',
    ],
    languageOptions: {
      globals: {
        mockGraphQLQuery: 'readonly',
        mockGraphQLMutation: 'readonly',
        mockCurrentUser: 'readonly',
        scenario: 'readonly',
        defineScenario: 'readonly',
      },
    },
  },
)

export const buildSharedConfig = (...paths) => {
  return sharedConfig.map((config) => {
    if (config.files) {
      config.files = paths.flatMap((path) => config.files?.map((f) => path + f))
    } else if (!config.ignores) {
      config.files = paths.map((path) => path + '**/*')
    }

    if (config.ignores) {
      config.ignores = paths.flatMap(
        (path) => config.ignores?.map((f) => path + f) || [],
      )
    }
    return config
  })
}
