// import path from 'node:path'
// import url from 'node:url'

import { createServerAdapter } from '@whatwg-node/server'
import express from 'express'
import type { HTTPMethod } from 'find-my-way'
import type { ViteDevServer } from 'vite'
import { createServer as createViteServer, createViteRuntime } from 'vite'
import { cjsInterop } from 'vite-plugin-cjs-interop'

import type { RouteSpec } from '@redwoodjs/internal/dist/routes.js'
import { getProjectRoutes } from '@redwoodjs/internal/dist/routes.js'
import type { Paths } from '@redwoodjs/project-config'
import { getConfig, getPaths } from '@redwoodjs/project-config'
import {
  createPerRequestMap,
  createServerStorage,
} from '@redwoodjs/server-store'
import type { Middleware } from '@redwoodjs/web/middleware'

import { registerFwGlobalsAndShims } from './lib/registerFwGlobalsAndShims.js'
import { invoke } from './middleware/invokeMiddleware.js'
import { createMiddlewareRouter } from './middleware/register.js'
import { rscRoutesAutoLoader } from './plugins/vite-plugin-rsc-routes-auto-loader.js'
import { rscRoutesImports } from './plugins/vite-plugin-rsc-routes-imports.js'
import { rscSsrRouterImport } from './plugins/vite-plugin-rsc-ssr-router-import.js'
import { collectCssPaths, componentsModules } from './streaming/collectCss.js'
import { createReactStreamingHandler } from './streaming/createReactStreamingHandler.js'
import {
  convertExpressHeaders,
  ensureProcessDirWeb,
  getFullUrl,
} from './utils.js'

// TODO (STREAMING) Just so it doesn't error out. Not sure how to handle this.
globalThis.__REDWOOD__PRERENDER_PAGES = {}
globalThis.__rwjs__vite_ssr_runtime = undefined
globalThis.__rwjs__vite_rsc_runtime = undefined

async function createServer() {
  ensureProcessDirWeb()

  registerFwGlobalsAndShims()

  const app = express()
  const rwPaths = getPaths()

  const rscEnabled = getConfig().experimental.rsc?.enabled ?? false

  // Per request store is only used in server components
  const serverStorage = createServerStorage()

  app.use('*', (req, _res, next) => {
    const fullUrl = getFullUrl(req, rscEnabled)

    console.log('fullUrl', fullUrl)

    const perReqStore = createPerRequestMap({
      // Convert express headers to fetch header
      headers: convertExpressHeaders(req.headersDistinct),
      fullUrl,
    })

    // By wrapping next, we ensure that all of the other handlers will use this same perReqStore
    // But note that the serverStorage is RE-initialised for the RSC worker
    serverStorage.run(perReqStore, next)
  })

  // ~~~ Dev time validations ~~~~
  // TODO (STREAMING) When Streaming is released Vite will be the only bundler,
  // and this file should always exist. So the error message needs to change
  // (or be removed perhaps)
  if (!rwPaths.web.entryServer || !rwPaths.web.entryClient) {
    throw new Error(
      'Vite entry points not found. Please check that your project has ' +
        'an entry.client.{jsx,tsx} and entry.server.{jsx,tsx} file in ' +
        'the web/src directory.',
    )
  }

  if (!rwPaths.web.viteConfig) {
    throw new Error(
      'Vite config not found. You need to setup your project with Vite using `yarn rw setup vite`',
    )
  }
  // ~~~~ Dev time validations ~~~~

  // Create Vite server in middleware mode and configure the app type as
  // 'custom', disabling Vite's own HTML serving logic so parent server
  // can take control
  const vite = await createViteServer({
    configFile: rwPaths.web.viteConfig,
    envFile: false,
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
    ssr: {
      // Inline every file apart from node built-ins. We want vite/rollup to
      // inline dependencies in the server build. This gets round runtime
      // importing of "server-only" and other packages with poisoned imports.
      //
      // Files included in `noExternal` are files we want Vite to analyze
      // As of vite 5.2 `true` here means "all except node built-ins"
      // noExternal: true,
      // TODO (RSC): Other frameworks build for RSC without `noExternal: true`.
      // What are we missing here? When/why is that a better choice? I know
      // we would have to explicitly add a bunch of packages to noExternal, if
      // we wanted to go that route.
      // noExternal: ['@tobbe.dev/rsc-test'],
      // Can't inline prisma client (db calls fail at runtime) or react-dom
      // (css pre-init failure)
      // Server store has to be externalized, because it's a singleton (shared between FW and App)
      external: [
        '@prisma/client',
        '@prisma/fetch-engine',
        '@prisma/internals',
        '@redwoodjs/auth-dbauth-api',
        '@redwoodjs/cookie-jar',
        '@redwoodjs/server-store',
        '@simplewebauthn/server',
        'graphql-scalars',
        'minimatch',
        'playwright',
        'react-dom',
      ],
      resolve: {
        // These conditions are used in the plugin pipeline, and only affect non-externalized
        // dependencies during the SSR build. Which because of `noExternal: true` means all
        // dependencies apart from node built-ins.
        // TODO (RSC): What's the difference between `conditions` and
        // `externalConditions`? When is one used over the other?
        // conditions: ['react-server'],
        // externalConditions: ['react-server'],
      },
      optimizeDeps: {
        // We need Vite to optimize these dependencies so that they are resolved
        // with the correct conditions. And so that CJS modules work correctly.
        // include: [
        //   'react/**/*',
        //   'react-dom/server',
        //   'react-dom/server.edge',
        //   'rehackt',
        //   'react-server-dom-webpack/server',
        //   'react-server-dom-webpack/client',
        //   '@apollo/client/cache/*',
        //   '@apollo/client/utilities/*',
        //   '@apollo/client/react/hooks/*',
        //   'react-fast-compare',
        //   'invariant',
        //   'shallowequal',
        //   'graphql/language/*',
        //   'stacktracey',
        //   'deepmerge',
        //   'fast-glob',
        // ],
      },
    },
    resolve: {
      // conditions: ['react-server'],
    },
    plugins: [
      cjsInterop({
        dependencies: [
          // Skip ESM modules: rwjs/auth, rwjs/web, rwjs/auth-*-middleware, rwjs/router
          '@redwoodjs/forms',
          '@redwoodjs/prerender/*',
          '@redwoodjs/auth-*-api',
          '@redwoodjs/auth-*-web',
        ],
      }),
      rscEnabled && rscRoutesAutoLoader(),
      rscEnabled && rscSsrRouterImport(),
    ],
    server: { middlewareMode: true },
    logLevel: 'info',
    clearScreen: false,
    appType: 'custom',
  })

  globalThis.__rwjs__vite_ssr_runtime = await createViteRuntime(vite)

  // TODO (RSC): No redwood-vite plugin, add it in here
  const viteRscServer = await createViteServer({
    envFile: false,
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
    ssr: {
      // Inline every file apart from node built-ins. We want vite/rollup to
      // inline dependencies in the server build. This gets round runtime
      // importing of "server-only" and other packages with poisoned imports.
      //
      // Files included in `noExternal` are files we want Vite to analyze
      // As of vite 5.2 `true` here means "all except node built-ins"
      noExternal: true,
      // TODO (RSC): Other frameworks build for RSC without `noExternal: true`.
      // What are we missing here? When/why is that a better choice? I know
      // we would have to explicitly add a bunch of packages to noExternal, if
      // we wanted to go that route.
      // noExternal: ['@tobbe.dev/rsc-test'],
      // Can't inline prisma client (db calls fail at runtime) or react-dom
      // (css pre-init failure)
      // Server store has to be externalized, because it's a singleton (shared between FW and App)
      external: [
        '@prisma/client',
        '@prisma/fetch-engine',
        '@prisma/internals',
        '@redwoodjs/auth-dbauth-api',
        '@redwoodjs/cookie-jar',
        '@redwoodjs/server-store',
        '@simplewebauthn/server',
        'graphql-scalars',
        'minimatch',
        'playwright',
        'react-dom',
      ],
      resolve: {
        // These conditions are used in the plugin pipeline, and only affect non-externalized
        // dependencies during the SSR build. Which because of `noExternal: true` means all
        // dependencies apart from node built-ins.
        // TODO (RSC): What's the difference between `conditions` and
        // `externalConditions`? When is one used over the other?
        conditions: ['react-server'],
        externalConditions: ['react-server'],
      },
      optimizeDeps: {
        // We need Vite to optimize these dependencies so that they are resolved
        // with the correct conditions. And so that CJS modules work correctly.
        include: [
          'react/**/*',
          'react-dom/server',
          'react-dom/server.edge',
          'rehackt',
          'react-server-dom-webpack/server',
          'react-server-dom-webpack/server.edge',
          'react-server-dom-webpack/client',
          'react-server-dom-webpack/client.edge',
          '@apollo/client/cache/*',
          '@apollo/client/utilities/*',
          '@apollo/client/react/hooks/*',
          'react-fast-compare',
          'invariant',
          'shallowequal',
          'graphql/language/*',
          'stacktracey',
          'deepmerge',
          'fast-glob',
        ],
        // exclude: ['webpack']
      },
    },
    resolve: {
      conditions: ['react-server'],
    },
    plugins: [
      // The rscTransformUseClientPlugin maps paths like
      // /Users/tobbe/.../rw-app/node_modules/@tobbe.dev/rsc-test/dist/rsc-test.es.js
      // to
      // /Users/tobbe/.../rw-app/web/dist/ssr/assets/rsc0.js
      // That's why it needs the `clientEntryFiles` data
      // (It does other things as well, but that's why it needs clientEntryFiles)
      // rscTransformUseClientPlugin(clientEntryFiles),
      // rscTransformUseServerPlugin(outDir, serverEntryFiles),
      rscRoutesImports(),
    ],
    build: {
      ssr: true,
    },
  })

  globalThis.__rwjs__vite_rsc_runtime = await createViteRuntime(viteRscServer)

  // create a handler that will invoke middleware with or without a route
  // The DEV one will create a new middleware router on each request
  const handleWithMiddleware = (route?: RouteSpec) => {
    return createServerAdapter(async (req: Request) => {
      // Recreate middleware router on each request in dev
      const middlewareRouter = await createMiddlewareRouter(vite)
      const middleware = middlewareRouter.find(
        req.method as HTTPMethod,
        req.url,
      )?.handler as Middleware | undefined

      if (!middleware) {
        return new Response('No middleware found', { status: 404 })
      }

      const [mwRes] = await invoke(req, middleware, {
        route,
        viteDevServer: vite,
      })

      return mwRes.toResponse()
    })
  }

  // use vite's connect instance as middleware
  app.use(vite.middlewares)

  if (rscEnabled) {
    // const { createRscRequestHandler } = await import(
    //   './rsc/rscRequestHandler.js'
    // )
    // const { createRscRequestHandler } = await viteRuntime.executeUrl(
    //   new URL('./rsc/rscRequestHandler.js', import.meta.url).pathname,
    // )
    // Mounting middleware at /rw-rsc will strip /rw-rsc from req.url
    app.use(
      '/rw-rsc',
      // createRscRequestHandler({
      //   getMiddlewareRouter: async () => createMiddlewareRouter(vite),
      //   viteDevServer: vite,
      // }),
      (req, res, next) => {
        console.log('req.originalUrl', req.originalUrl, 'req.url', req.url)
        console.log('req.headers.host', req.headers.host)
        console.log("req.headers['rw-rsc']", req.headers['rw-rsc'])

        return next()
      },
    )
  }

  const routes = getProjectRoutes()

  const routeHandler = await createReactStreamingHandler(
    {
      routes,
      clientEntryPath: rwPaths.web.entryClient,
      getStylesheetLinks: (route) => {
        // In dev route is a RouteSpec, with additional properties
        return getCssLinks({ rwPaths, route: route as RouteSpec, vite })
      },
      // Recreate middleware router on each request in dev
      getMiddlewareRouter: async () => createMiddlewareRouter(vite),
    },
    vite,
  )

  app.get('*', createServerAdapter(routeHandler))

  // invokes middleware for any POST request for auth
  app.post('*', handleWithMiddleware())

  const port = getConfig().web.port
  console.log(`Started server on http://localhost:${port}`)
  return app.listen(port)
}

let devApp = createServer()

process.stdin.on('data', async (data) => {
  const str = data.toString().trim().toLowerCase()
  if (str === 'rs' || str === 'restart') {
    console.log('Restarting dev web server.....')
    ;(await devApp).close(() => {
      devApp = createServer()
    })
  }
})

/**
 * This function is used to collect the CSS links for a given route.
 *
 * Passed as a getter to the createReactStreamingHandler function, because
 * at the time of creating the handler, the ViteDevServer hasn't analysed the module graph yet
 */
function getCssLinks({
  rwPaths,
  route,
  vite,
}: {
  rwPaths: Paths
  route?: RouteSpec
  vite: ViteDevServer
}) {
  const appAndRouteModules = componentsModules(
    [rwPaths.web.app, route?.filePath].filter(Boolean) as string[],
    vite,
  )

  const collectedCss = collectCssPaths(appAndRouteModules)

  const cssLinks = Array.from(collectedCss)
  return cssLinks
}
