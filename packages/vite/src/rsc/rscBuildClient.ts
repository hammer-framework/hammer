import path from 'node:path'

import react from '@vitejs/plugin-react'
import { build as viteBuild } from 'vite'

import { getWebSideDefaultBabelConfig } from '@redwoodjs/babel-config'
import { getPaths } from '@redwoodjs/project-config'

import { getEnvVarDefinitions } from '../envVarDefinitions'
import { onWarn } from '../lib/onWarn'

import { rscIndexPlugin } from './rscVitePlugins'

/**
 * RSC build. Step 2.
 * buildFeServer -> buildRscFeServer -> rscBuildClient
 * Generate the client bundle
 */
export async function rscBuildClient(
  webHtml: string,
  webDist: string,
  clientEntryFiles: Record<string, string>
) {
  console.log('\n')
  console.log('2. rscBuildClient')
  console.log('=================\n')

  const rwPaths = getPaths()

  const clientBuildOutput = await viteBuild({
    // configFile: viteConfigPath,
    root: rwPaths.web.src,
    envPrefix: 'REDWOOD_ENV_',
    publicDir: path.join(rwPaths.web.base, 'public'),
    envFile: false,
    define: getEnvVarDefinitions(),
    plugins: [
      react({
        babel: {
          ...getWebSideDefaultBabelConfig({
            forVite: true,
            forRscClient: true,
          }),
        },
      }),
      rscIndexPlugin(),
    ],
    build: {
      outDir: webDist,
      emptyOutDir: true, // Needed because `outDir` is not inside `root`
      // TODO (RSC) Enable this when we switch to a server-first approach
      // emptyOutDir: false, // Already done when building server
      rollupOptions: {
        onwarn: onWarn,
        input: {
          main: webHtml,
          ...clientEntryFiles,
        },
        preserveEntrySignatures: 'exports-only',
        output: {
          // This is not ideal. See
          // https://rollupjs.org/faqs/#why-do-additional-imports-turn-up-in-my-entry-chunks-when-code-splitting
          // But we need it to prevent `import 'client-only'` from being
          // hoisted into App.tsx
          // TODO (RSC): Fix when https://github.com/rollup/rollup/issues/5235
          // is resolved
          hoistTransitiveImports: false,
        },
      },
      manifest: 'client-build-manifest.json',
    },
    esbuild: {
      logLevel: 'debug',
    },
  })

  if (!('output' in clientBuildOutput)) {
    throw new Error('Unexpected vite client build output')
  }

  return clientBuildOutput.output
}
