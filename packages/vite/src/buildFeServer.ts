import { buildWeb } from '@redwoodjs/internal/dist/build/web'
import { getConfig, getPaths } from '@redwoodjs/project-config'

import { buildRouteHooks } from './buildRouteHooks'
import { buildRouteManifest } from './buildRouteManifest'
import { buildRscClientAndServer } from './buildRscClientAndServer'
import { buildForStreamingServer } from './streaming/buildForStreamingServer'
import { ensureProcessDirWeb } from './utils'

export interface BuildOptions {
  verbose?: boolean
  webDir?: string
}

export const buildFeServer = async ({ verbose, webDir }: BuildOptions = {}) => {
  ensureProcessDirWeb(webDir)

  const rwPaths = getPaths()
  const rwConfig = getConfig()
  const viteConfigPath = rwPaths.web.viteConfig

  const rscEnabled = rwConfig.experimental?.rsc?.enabled
  const streamingSsrEnabled = rwConfig.experimental?.streamingSsr?.enabled

  if (!viteConfigPath) {
    throw new Error(
      'Vite config not found. You need to setup your project with Vite ' +
        'using `yarn rw setup vite`'
    )
  }

  if (!rwPaths.web.entryServer || !rwPaths.web.entryClient) {
    throw new Error(
      'Vite entry points not found. Please check that your project has an ' +
        'entry.client.{jsx,tsx} and entry.server.{jsx,tsx} file in the ' +
        'web/src directory.'
    )
  }

  if (rscEnabled) {
    if (!rwPaths.web.entries) {
      throw new Error('RSC entries file not found')
    }

    await buildRscClientAndServer()
  }

  // We generate the RSC client bundle in the rscBuildClient function
  // Streaming and RSC client bundles are **not** the same
  if (streamingSsrEnabled && !rscEnabled) {
    console.log('Building client for streaming SSR...\n')
    await buildWeb({ verbose })
  }

  await buildForStreamingServer({ verbose })

  await buildRouteHooks(verbose, rwPaths)

  // Write a route manifest
  await buildRouteManifest()
}
