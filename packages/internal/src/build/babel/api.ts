import fs from 'fs'
import path from 'path'

import type { TransformOptions } from '@babel/core'
import * as babel from '@babel/core'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore Not inside tsconfig rootdir
import pkgJson from '../../../package.json'
import { getPaths } from '../../paths'

import { registerBabel, RegisterHookOptions } from './common'

export const getApiSideBabelPlugins = () => {
  const rwjsPaths = getPaths()
  // Plugin shape: [ ["Target", "Options", "name"] ],
  // a custom "name" is supplied so that user's do not accidently overwrite
  // Redwood's own plugins when they specify their own.

  const corejsMajorMinorVersion = pkgJson.dependencies['core-js']
    .split('.')
    .splice(0, 2)
    .join('.') // Gives '3.16' instead of '3.16.12'

  const plugins: TransformOptions['plugins'] = [
    ['@babel/plugin-transform-typescript', undefined, 'rwjs-babel-typescript'],
    [
      'babel-plugin-polyfill-corejs3',
      {
        method: 'usage-global',
        corejs: corejsMajorMinorVersion,
        proposals: true, // Bug: https://github.com/zloirock/core-js/issues/978#issuecomment-904839852
        targets: { node: 12 }, // Netlify defaults NodeJS 12: https://answers.netlify.com/t/aws-lambda-now-supports-node-js-14/31789/3
      },
      'rwjs-babel-polyfill',
    ],
    [
      require('../babelPlugins/babel-plugin-redwood-src-alias').default,
      {
        srcAbsPath: rwjsPaths.api.src,
      },
      'rwjs-babel-src-alias',
    ],
    [
      require('../babelPlugins/babel-plugin-redwood-directory-named-import')
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
    // FIXME: `graphql-tag` is not working: https://github.com/redwoodjs/redwood/pull/3193
    ['babel-plugin-graphql-tag', undefined, 'rwjs-babel-graphql-tag'],
    [
      require('../babelPlugins/babel-plugin-redwood-import-dir').default,
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
  ...rest
}: RegisterHookOptions = {}) => {
  registerBabel({
    configFile: getApiSideBabelConfigPath(), // incase user has a custom babel.config.js in api
    babelrc: false, // Disables `.babelrc` config
    extensions: ['.js', '.ts'],
    plugins: [...getApiSideBabelPlugins(), ...plugins],
    ignore: ['node_modules'],
    cache: false,
    ...rest,
  })
}

export const prebuildFile = (
  srcPath: string,
  // we need to know dstPath as well
  // so we can generate an inline, relative sourcemap
  dstPath: string,
  plugins: TransformOptions['plugins']
) => {
  const code = fs.readFileSync(srcPath, 'utf-8')

  const result = babel.transform(code, {
    cwd: getPaths().api.base,
    babelrc: false, // Disables `.babelrc` config
    configFile: getApiSideBabelConfigPath(),
    filename: srcPath,
    // we set the sourceFile (for the sourcemap) as a correct, relative path
    // this is why this function (prebuildFile) must know about the dstPath
    sourceFileName: path.relative(path.dirname(dstPath), srcPath),
    // we need inline sourcemaps at this level
    // because this file will eventually be fed to esbuild
    // when esbuild finds an inline sourcemap, it tries to "combine" it
    // so the final sourcemap (the one that esbuild generates) combines both mappings
    sourceMaps: 'inline',
    plugins,
  })
  return result
}
