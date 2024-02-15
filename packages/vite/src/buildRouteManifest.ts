import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'

import type { Manifest as ViteBuildManifest } from 'vite'

import { getProjectRoutes } from '@redwoodjs/internal/dist/routes'
import { getAppRouteHook, getPaths } from '@redwoodjs/project-config'

import type { RWRouteManifest } from './types'

/**
 * RSC build. Step 6.
 * Generate a route manifest file for the web server side.
 */
export async function buildRouteManifest() {
  const buildManifestUrl = url.pathToFileURL(
    path.join(getPaths().web.dist + '/client', 'client-build-manifest.json')
  ).href
  const clientBuildManifest: ViteBuildManifest = (
    await import(buildManifestUrl, { with: { type: 'json' } })
  ).default

  const routesList = getProjectRoutes()

  const routeManifest = routesList.reduce<RWRouteManifest>((acc, route) => {
    acc[route.pathDefinition] = {
      name: route.name,
      bundle: route.relativeFilePath
        ? clientBuildManifest[route.relativeFilePath]?.file ?? null
        : null,
      matchRegexString: route.matchRegexString,
      // NOTE this is the path definition, not the actual path
      // E.g. /blog/post/{id:Int}
      pathDefinition: route.pathDefinition,
      hasParams: route.hasParams,
      routeHooks: FIXME_constructRouteHookPath(route.routeHooks),
      redirect: route.redirect
        ? {
            to: route.redirect?.to,
            permanent: false,
          }
        : null,
      renderMode: route.renderMode,
    }

    return acc
  }, {})

  console.log('routeManifest', JSON.stringify(routeManifest, null, 2))

  const webRouteManifest = getPaths().web.routeManifest
  return fs.writeFile(webRouteManifest, JSON.stringify(routeManifest, null, 2))
}

// TODO (STREAMING) Hacky work around because when you don't have a App.routeHook, esbuild doesn't create
// the pages folder in the dist/server/routeHooks directory.
// @MARK need to change to .mjs here if we use esm
const FIXME_constructRouteHookPath = (
  routeHookSrcPath: string | null | undefined
) => {
  const rwPaths = getPaths()
  if (!routeHookSrcPath) {
    return null
  }

  if (getAppRouteHook()) {
    return path
      .relative(rwPaths.web.src, routeHookSrcPath)
      .replace('.ts', '.js')
  } else {
    return path
      .relative(path.join(rwPaths.web.src, 'pages'), routeHookSrcPath)
      .replace('.ts', '.js')
  }
}
