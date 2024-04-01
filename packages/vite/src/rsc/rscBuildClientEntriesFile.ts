import fs from 'fs/promises'

import { getPaths } from '@redwoodjs/project-config'

import type { rscBuildClient } from './rscBuildClient.js'
import type { rscBuildForServer } from './rscBuildForServer.js'

/**
 * RSC build. Step 5.
 * Append a mapping of server asset names to client asset names to the
 * `web/dist/rsc/entries.js` file.
 * Only used by the RSC worker.
 */
// TODO(RSC_DC): This function should eventually be removed.
// The dev server will need this implemented as a Vite plugin,
// so worth waiting till implementation to swap out and just include the plugin for the prod build
export function rscBuildClientEntriesMappings(
  clientBuildOutput: Awaited<ReturnType<typeof rscBuildClient>>,
  serverBuildOutput: Awaited<ReturnType<typeof rscBuildForServer>>,
  clientEntryFiles: Record<string, string>,
) {
  console.log('\n')
  console.log('5. rscBuildClientEntriesMapping')
  console.log('===============================\n')

  const rwPaths = getPaths()

  const clientEntries: Record<string, string> = {}
  for (const item of clientBuildOutput) {
    const { name, fileName } = item

    const entryFile =
      name &&
      // TODO (RSC) Can't we just compare the names? `item.name === name`
      serverBuildOutput.find(
        (item) =>
          'moduleIds' in item &&
          item.moduleIds.includes(clientEntryFiles[name] as string),
      )?.fileName

    if (entryFile) {
      console.log('entryFile', entryFile)
      if (process.platform === 'win32') {
        // Prevent errors on Windows like
        // Error: No client entry found for D:/a/redwood/rsc-project/web/dist/server/assets/rsc0.js
        const entryFileSlash = entryFile.replaceAll('\\', '/')
        console.log('entryFileSlash', entryFileSlash)
        clientEntries[entryFileSlash] = fileName
      } else {
        clientEntries[entryFile] = fileName
      }
    }
  }

  console.log('clientEntries', clientEntries)

  return fs.appendFile(
    rwPaths.web.distRscEntries,
    `export const clientEntries=${JSON.stringify(clientEntries)};`,
  )
}
