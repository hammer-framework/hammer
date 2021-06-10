import fs from 'fs'
import path from 'path'

import React from 'react'

import babelRequireHook from '@babel/register'
import ReactDOMServer from 'react-dom/server'

import { getPaths } from '@redwoodjs/internal'
import { LocationProvider } from '@redwoodjs/router'

import mediaImportsPlugin from './babelPlugins/babel-plugin-redwood-prerender-media-imports'
import { getRootHtmlPath, registerShims, writeToDist } from './internal'

interface PrerenderParams {
  routerPath: string // e.g. /about, /dashboard/me
}

const rwWebPaths = getPaths().web

// Prerender specific configuration
// extends projects web/babelConfig
babelRequireHook({
  extends: path.join(rwWebPaths.base, '.babelrc.js'),
  extensions: ['.js', '.ts', '.tsx', '.jsx'],
  overrides: [
    {
      plugins: [
        ['ignore-html-and-css-imports'], // webpack/postcss handles CSS imports
        [
          'babel-plugin-module-resolver',
          {
            alias: {
              src: rwWebPaths.src,
            },
            root: [getPaths().web.base],
            // needed for respecting users' custom aliases in web/.babelrc
            // See https://github.com/tleunen/babel-plugin-module-resolver/blob/master/DOCS.md#cwd
            cwd: 'babelrc',
            loglevel: 'silent', // to silence the unnecessary warnings
          },
          'prerender-module-resolver', // add this name, so it doesn't overwrite custom module resolvers in users' web/.babelrc
        ],
        [mediaImportsPlugin],
      ],
    },
  ],
  only: [getPaths().base],
  ignore: ['node_modules'],
  cache: false,
})

export const runPrerender = async ({
  routerPath,
}: PrerenderParams): Promise<string | void> => {
  registerShims()

  const indexContent = fs.readFileSync(getRootHtmlPath()).toString()
  const { default: App } = await import(getPaths().web.app)

  const componentAsHtml = ReactDOMServer.renderToString(
    <LocationProvider
      location={{
        pathname: routerPath,
      }}
    >
      <App />
    </LocationProvider>
  )

  // This is set by webpack by the html plugin
  const renderOutput = indexContent.replace(
    '<server-markup></server-markup>',
    componentAsHtml
  )

  return renderOutput
}

// Used by cli at build time
export const writePrerenderedHtmlFile = (
  outputHtmlPath: string,
  content: string
) => {
  // Copy default index.html to 200.html first
  // This is to prevent recursively rendering the home page
  if (outputHtmlPath === 'web/dist/index.html') {
    fs.copyFileSync(outputHtmlPath, 'web/dist/200.html')
  }

  writeToDist(outputHtmlPath, content)
}
