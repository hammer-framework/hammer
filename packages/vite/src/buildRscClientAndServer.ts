import { rscBuildAnalyze } from './rsc/rscBuildAnalyze'
import { rscBuildClient } from './rsc/rscBuildClient'
import { rscBuildClientEntriesMappings } from './rsc/rscBuildClientEntriesFile'
import { rscBuildCopyCssAssets } from './rsc/rscBuildCopyCssAssets'
import { rscBuildForServer } from './rsc/rscBuildForServer'
import { rscBuildRwEnvVars } from './rsc/rscBuildRwEnvVars'

export const buildRscClientAndServer = async () => {
  // Analyze all files and generate a list of RSCs and RSFs
  const { clientEntryFiles, serverEntryFiles } = await rscBuildAnalyze()

  // Generate the client bundle
  const clientBuildOutput = await rscBuildClient(clientEntryFiles)

  // Generate the server output
  const serverBuildOutput = await rscBuildForServer(
    clientEntryFiles,
    serverEntryFiles,
    {}
  )

  // Copy CSS assets from server to client
  //
  // TODO (RSC): We need to better understand how this work and how it can be
  // improved.
  // Can we do this more similar to how it's done for streaming?
  await rscBuildCopyCssAssets(serverBuildOutput)

  // Mappings from server to client asset file names
  // Used by the RSC worker
  await rscBuildClientEntriesMappings(
    clientBuildOutput,
    serverBuildOutput,
    clientEntryFiles
  )

  // Make RW specific env vars, like RWJS_ENV, available to server components
  await rscBuildRwEnvVars()
}
