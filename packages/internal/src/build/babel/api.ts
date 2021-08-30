import fs from 'fs'
import path from 'path'

import type { TransformOptions } from '@babel/core'

import { getPaths } from '../../paths'

import { registerBabel, RegisterHookOptions } from './common'

export const getApiSideBabelPlugins = () => {
  const rwjsPaths = getPaths()
  // Plugin shape: [ ["Target", "Options", "name"] ],
  // a custom "name" is supplied so that user's do not accidently overwrite
  // Redwood's own plugins.
  const plugins: TransformOptions['plugins'] = [
    ['@babel/plugin-transform-typescript', undefined, 'rwjs-babel-typescript'],
    [
      require('@redwoodjs/core/dist/babelPlugins/babel-plugin-redwood-src-alias')
        .default,
      {
        srcAbsPath: rwjsPaths.api.src,
      },
      'rwjs-babel-src-alias',
    ],
    [
      require('@redwoodjs/core/dist/babelPlugins/babel-plugin-redwood-directory-named-import')
        .default,
      undefined,
      'rwjs-babel-directory-named-modules',
    ],
    [
      'babel-plugin-auto-import',
      {
        declarations: [
          {
            // import gql from 'graphql-tag'
            default: 'gql',
            path: 'graphql-tag',
          },
          {
            // import { context } from '@redwoodjs/graphql-server'
            members: ['context'],
            path: '@redwoodjs/graphql-server',
          },
        ],
      },
      'rwjs-babel-auto-import',
    ],
    // FIXME: Babel plugin GraphQL tag doesn't seem to be working.
    ['babel-plugin-graphql-tag', undefined, 'rwjs-babel-graphql-tag'],
    [
      require('@redwoodjs/core/dist/babelPlugins/babel-plugin-redwood-import-dir')
        .default,
      undefined,
      'rwjs-babel-glob-import-dir',
    ],
  ].filter(Boolean)

  return plugins
}

export const getApiSideBabelConfigPath = () => {
  const p = path.join(getPaths().api.base, 'babel.config.js')
  if (fs.existsSync(p)) {
    return p
  } else {
    return undefined
  }
}

// Used in cli commands that need to use es6, lib and services
export const registerApiSideBabelHook = ({
  plugins = [],
  overrides,
}: RegisterHookOptions = {}) => {
  registerBabel({
    // @NOTE
    // Even though we specify the config file, babel will still search for it
    // and merge them because we have specified the filename property, unless babelrc = false
    configFile: getApiSideBabelConfigPath(), // incase user has a custom babel.config.js in api
    babelrc: false,
    extensions: ['.js', '.ts'],
    plugins: [...getApiSideBabelPlugins(), ...plugins],
    ignore: ['node_modules'],
    cache: false,
    overrides,
  })
}
