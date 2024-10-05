//@ts-check
import babelParser from '@babel/eslint-parser'
import babelPlugin from '@babel/eslint-plugin'
import { FlatCompat } from '@eslint/eslintrc'
import eslintJs from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import { EslintEnvProcessor } from 'eslint-plugin-eslint-env'
import * as importPlugin from 'eslint-plugin-import'
import jestDomPlugin from 'eslint-plugin-jest-dom'
import jsxA11Y from 'eslint-plugin-jsx-a11y'
import reactPlugin from 'eslint-plugin-react'
import unusedImportsPlugin from 'eslint-plugin-unused-imports'
import globals from 'globals'
import tsEslint from 'typescript-eslint'

import redwoodjsPlugin from '@redwoodjs/eslint-plugin'
import { findUp } from '@redwoodjs/project-config'
import { buildSharedConfig } from './eslint.config.shared.mjs'

// Framework Babel config is monorepo root ./babel.config.js
// `yarn lint` runs for each workspace, which needs findUp for path to root
const findBabelConfig = (cwd = process.cwd()) => {
  const configPath = findUp('babel.config.js', cwd)
  if (!configPath) {
    throw new Error(`Eslint-parser could not find a "babel.config.js" file`)
  }
  return configPath
}

const compat = new FlatCompat()

export default tsEslint.config(
  {
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/fixtures',
      'packages/babel-config/src/plugins/__tests__/__fixtures__/**/*',
      'packages/babel-config/src/__tests__/__fixtures__/**/*',
      'packages/codemods/**/__testfixtures__/**/*',
      'packages/cli/**/__testfixtures__/**/*',
      'packages/storage/src/__tests__/prisma-client/*',
    ],
  },
  eslintJs.configs.recommended,
  reactPlugin.configs.flat.recommended,
  jestDomPlugin.configs['flat/recommended'],

  // TODO: Plugins that are missing flat config support
  ...compat.extends('plugin:react-hooks/recommended'),
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

    // Handle eslint-env comments in flat config
    processor: new EslintEnvProcessor(),

    linterOptions: {
      // Prevents unused eslint-disable comments
      reportUnusedDisableDirectives: true,
    },

    languageOptions: {
      globals: {
        // We use the most modern environment available. Then we rely on Babel to
        // transpile it to something that can run on all node versions we support
        ...globals.es2022,
      },
      parser: babelParser,
      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },

        babelOptions: {
          configFile: findBabelConfig(),
        },
      },
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
      curly: 'error',
      'unused-imports/no-unused-imports': 'error',
      '@redwoodjs/process-env-computed': 'error',
      'no-console': 'off',
      'no-extra-semi': 'off',
      'prefer-object-spread': 'warn',
      'prefer-spread': 'warn',

      'no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true,
        },
      ],

      'no-useless-escape': 'off',

      camelcase: [
        'warn',
        {
          properties: 'never',
        },
      ],

      'no-new': 'warn',

      'new-cap': [
        'error',
        {
          newIsCap: true,
          capIsNew: false,
        },
      ],

      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        },
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
    },
  },
  // We disable react-hooks/rules-of-hooks for packages which do not deal with React code
  {
    files: [
      'packages/api-server/**/*.ts',
      'packages/graphql-server/**/*.ts',
      'packages/realtime/**/*.ts',
    ],

    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
  // TypeScript specific linting
  {
    files: ['**/*.ts', '**/*.mts', '**/*.tsx'],
    extends: [
      ...tsEslint.configs.recommendedTypeChecked,
      ...tsEslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      // This is disabled for now because of our legacy usage of `require`. It should be enabled in the future.
      '@typescript-eslint/no-require-imports': 'off',
      // This is disabled for now because of our vast usage of `any`. It should be enabled in the future.
      '@typescript-eslint/no-explicit-any': 'off',

      // We allow exceptions to the no-unused-vars rule for variables that start with an underscore
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        },
      ],

      // We want consistent `import type {} from '...'`
      '@typescript-eslint/consistent-type-imports': 'error',

      // We want consistent curly brackets
      curly: 'error',

      // Stylistic rules we have disabled
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/prefer-function-type': 'off',
      camelcase: 'off',

      // TODO(jgmw): Work through these and either keep disabled or fix and re-enable
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/prefer-promise-reject-errors': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/prefer-regexp-exec': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/unbound-method': 'off',
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
  // TODO: Remove legacy
  // Set the correct environment js config files
  {
    files: ['**/.eslintrc.js', '**/.babelrc.js'],

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
    },
  },
  {
    files: ['**/eslint.config.mjs'],

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
  },
  // Set the correct environment for Jest config files
  {
    files: ['**/jest.config.js', '**/jest.setup.js'],

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.commonjs,
        ...globals.jest,
      },
    },
  },
  // Browser Context
  //
  // We prevent "window" from being used, and instead require "global".
  // This is because prerender runs in the NodeJS context it's undefined.
  {
    files: [
      'packages/auth/src/**',
      'packages/forms/src/**',
      'packages/prerender/src/browserUtils/**',
      'packages/router/src/**',
      'packages/web/src/**',
    ],

    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser,
        window: 'off', // Developers should use `global` instead of window. Since window is undefined in NodeJS.
      },
    },
  },
  // Prevent @redwoodjs/internal imports in runtime (web+api) packages
  {
    files: [
      'packages/auth/src/**',
      'packages/forms/src/**',
      'packages/prerender/src/browserUtils/**',
      'packages/router/src/**',
      'packages/web/src/**',
      'packages/api/src/**',
      'packages/graphql-server/src/**',
      'packages/record/src/**',
      'packages/project-config/src/**',
    ],

    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@redwoodjs/internal', '@redwoodjs/internal/*'],
              message:
                'Do not import "@redwoodjs/internal" or subpackages in runtime modules, because it leads to MASSIVE bundle sizes',
            },
            {
              group: ['@redwoodjs/structure', '@redwoodjs/structure/*'],
              message:
                'Do not import "@redwoodjs/structure" or subpackages in runtime modules, because it leads to MASSIVE bundle sizes',
            },
          ],
        },
      ],
    },
  },
  // Entry.js rules
  {
    files: ['packages/web/src/entry/index.jsx'],

    languageOptions: {
      globals: {
        ...globals.browser,
        React: 'readonly',
      },
    },
  },
  // NodeJS Context
  {
    files: [
      'packages/api/src/**',
      'packages/api-server/src/**',
      'packages/cli/src/**',
      'packages/create-redwood-app/src/*.js',
      'packages/internal/src/**',
      'packages/prerender/src/**',
      'packages/structure/src/**',
      'packages/testing/src/**',
      'packages/testing/config/**',
      'packages/eslint-config/*.js',
      'packages/record/src/**',
      'packages/telemetry/src/**',
      'packages/vite/bins/**',
    ],

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  // Prevent bad imports in Node packages - cli and api packages
  {
    files: [
      'packages/api/src/**',
      'packages/api-server/src/**',
      'packages/cli/src/**',
      'packages/internal/src/**',
      'packages/prerender/src/**',
      'packages/structure/src/**',
      'packages/testing/src/**',
      'packages/testing/config/**',
      'packages/eslint-config/*.js',
      'packages/record/src/**',
      'packages/telemetry/src/**',
    ],

    rules: {
      'no-restricted-imports': [
        // for import x from ('@redwoodjs/internal')
        'error',
        {
          name: '@redwoodjs/internal',
          message:
            'To prevent bloat in CLI, do not import "@redwoodjs/internal" directly. Instead import like @redwoodjs/internal/dist/<file>, or await import',
        },
      ],

      'no-restricted-modules': [
        // for require('@redwoodjs/internal')
        'error',
        {
          name: '@redwoodjs/internal',
          message:
            'To prevent bloat in CLI, do not require "@redwoodjs/internal" directly. Instead require like @redwoodjs/internal/dist/<file>',
        },
      ],
    },
  },
  // Allow computed member access on process.env in NodeJS contexts and tests
  {
    files: ['packages/testing/**', 'packages/vite/src/index.ts'],

    rules: {
      '@redwoodjs/process-env-computed': 'off',
    },
  },
  {
    files: ['packages/project-config/**'],
    ignores: ['**/__tests__/**', '**/*.test.ts?(x)', '**/*.spec.ts?(x)'],

    rules: {
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: false,
          optionalDependencies: false,
          peerDependencies: true,
        },
      ],
    },
  },
  // Migrating projects that are used with "eslintConfig"
  ...buildSharedConfig(
    '**/__fixtures/*/**/',
    'packages/create-redwood-app/templates/*/**/',
  ),
  // Issues that appeared while migrating to flat config
  // TODO: Fix related issues
  {
    files: ['**/*.mjs'],
    rules: {
      'no-irregular-whitespace': 'off',
    },
  },
  {
    ignores: ['**/*.template'],
  },
  {
    rules: {
      '@typescript-eslint/await-thenable': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },
)
