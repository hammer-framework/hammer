import { existsSync } from 'fs'
import path from 'path'

import react from '@vitejs/plugin-react'
import {
  ConfigEnv,
  normalizePath,
  transformWithEsbuild,
  UserConfig,
} from 'vite'
import commonjs from 'vite-plugin-commonjs'
import EnvironmentPlugin from 'vite-plugin-environment'

import { getWebSideDefaultBabelConfig } from '@redwoodjs/internal/dist/build/babel/web'
import { getConfig, getPaths } from '@redwoodjs/project-config'

/**
 * Preconfigured vite plugin, with required config for Redwood apps.
 *
 */
export default function redwoodPluginVite() {
  const rwPaths = getPaths()
  const rwConfig = getConfig()

  const clientEntryPath = rwPaths.web.entryClient

  if (!clientEntryPath) {
    throw new Error(
      'Vite client entry point not found. Please check that your project has an entry-client.{jsx,tsx} file in the web/src directory.'
    )
  }

  return [
    {
      name: 'redwood-plugin-vite',

      // ---------- Bundle injection ----------
      // Used by Vite during dev, to inject the entrypoint.
      transformIndexHtml: {
        order: 'pre',
        handler: (html: string) => {
          // So we inject the entrypoint with the correct extension .tsx vs .jsx
          const relativeEntryPath = path.relative(
            rwPaths.web.src,
            clientEntryPath
          )
          // Check dis 👇
          // @TODO no slash in front, its going to break windows!!! ⚠️
          console.log(
            `👉 \n ~ file: index.ts:53 ~ relativeEntryPath:`,
            relativeEntryPath
          )

          // And then inject the entry
          if (existsSync(clientEntryPath)) {
            return html.replace(
              '</head>',
              `<script type="module" src="${relativeEntryPath}"></script>
        </head>`
            )
          } else {
            return html
          }
        },
      },
      // Used by rollup during build to inject the entrypoint
      // but note index.html does not come through as an id during dev
      transform: (code: string, id: string) => {
        if (
          existsSync(clientEntryPath) &&
          normalizePath(id) === normalizePath(rwPaths.web.html)
        ) {
          return {
            code: code.replace(
              '</head>',
              // Note that this is always JSX, because this runs for DIST, not src
              `<script type="module" src="/entry-client.jsx"></script>
        </head>`
            ),
            map: null,
          }
        } else {
          return {
            code,
            map: null, // Returning null here preserves the original sourcemap
          }
        }
      },
      // ---------- End Bundle injection ----------

      config: (options: UserConfig, env: ConfigEnv): UserConfig => {
        return {
          root: rwPaths.web.src,
          // resolve: {
          //   alias: [
          //     {
          //       find: 'src',
          //       replacement: redwoodPaths.web.src,
          //     },
          //   ],
          // },
          envPrefix: 'REDWOOD_ENV_',
          publicDir: path.join(rwPaths.web.base, 'public'),
          define: {
            RWJS_WEB_BUNDLER: JSON.stringify('vite'),
            RWJS_ENV: {
              // @NOTE we're avoiding process.env here, unlike webpack
              RWJS_API_GRAPHQL_URL:
                rwConfig.web.apiGraphQLUrl ?? rwConfig.web.apiUrl + '/graphql',
              RWJS_API_URL: rwConfig.web.apiUrl,
              __REDWOOD__APP_TITLE:
                rwConfig.web.title || path.basename(rwPaths.base),
            },
            RWJS_DEBUG_ENV: {
              RWJS_SRC_ROOT: rwPaths.web.src,
              REDWOOD_ENV_EDITOR: JSON.stringify(
                process.env.REDWOOD_ENV_EDITOR
              ),
            },
          },
          css: {
            // @NOTE config path is relative to where vite.config.js is if you use relative path
            // postcss: './config/',
            postcss: rwPaths.web.config,
          },
          server: {
            open: rwConfig.browser.open,
            port: rwConfig.web.port,
            host: rwConfig.web.host,
            proxy: {
              //@TODO we need to do a check for absolute urls here
              [rwConfig.web.apiUrl]: {
                target: `http://localhost:${rwConfig.api.port}`,
                changeOrigin: true,
                // @MARK might be better to use a regex maybe
                rewrite: (path) => path.replace(rwConfig.web.apiUrl, ''),
              },
            },
          },
          build: {
            outDir: options.build?.outDir || rwPaths.web.dist,
            emptyOutDir: true,
            manifest: !env.ssrBuild ? 'build-manifest.json' : undefined,
            sourcemap: !env.ssrBuild && rwConfig.web.sourceMap, // Note that this can be boolean or 'inline'
          },
          // To produce a cjs bundle for SSR
          legacy: {
            buildSsrCjsExternalHeuristics: env.ssrBuild,
          },
          optimizeDeps: {
            esbuildOptions: {
              // @MARK this is because JS projects in Redwood don't have .jsx extensions
              loader: {
                '.js': 'jsx',
              },
              // Node.js global to browser globalThis
              // @MARK unsure why we need this, but required for DevFatalErrorPage atleast
              define: {
                global: 'globalThis',
              },
            },
          },
        }
      },
    },
    // Loading Environment Variables, to process.env in the browser
    // This maintains compatibility with Webpack. We can choose to switch to import.meta.env at a later stage
    EnvironmentPlugin('all', { prefix: 'REDWOOD_ENV_', loadEnvFiles: false }),
    EnvironmentPlugin(
      Object.fromEntries(
        rwConfig.web.includeEnvironmentVariables.map((envName) => [
          envName,
          JSON.stringify(process.env[envName]),
        ])
      ),
      {
        loadEnvFiles: false, // to prevent vite from loading .env files
      }
    ),
    // -----------------
    {
      // @MARK Adding this custom plugin to support jsx files with .js extensions
      // This is the default in Redwood JS projects. We can remove this once Vite is stable,
      // and have a codtemod to convert all JSX files to .jsx extensions
      name: 'transform-js-files-as-jsx',
      async transform(code: string, id: string) {
        if (!id.match(/src\/.*\.js$/)) {
          return
        }

        // Use the exposed transform from vite, instead of directly
        // transforming with esbuild
        return transformWithEsbuild(code, id, {
          loader: 'jsx',
        })
      },
    },
    react({
      babel: {
        ...getWebSideDefaultBabelConfig({
          forVite: true,
        }),
      },
    }),
    // End HTML transform------------------

    // @MARK We add this as a temporary workaround for DevFatalErrorPage being required
    // Note that it only transforms commonjs in dev, which is exactly what we want!
    // and is limited to the default FatalErrorPage (by name)
    commonjs({
      filter: (id: string) => {
        return id.includes('FatalErrorPage') || id.includes('Routes')
      },
    }),
  ]
}
