import path from 'node:path'

import fs from 'fs-extra'
import { Listr } from 'listr2'
import { format } from 'prettier'

import { addWebPackages, getPrettierOptions } from '@redwoodjs/cli-helpers'
import { getConfig, getPaths } from '@redwoodjs/project-config'

import { runTransform } from '../../../../lib/runTransform'

export async function handler({ force }: { force: boolean }) {
  const rwPaths = getPaths()
  const rootPkgJson = fs.readJSONSync(path.join(rwPaths.base, 'package.json'))
  const currentProjectVersion = rootPkgJson.devDependencies['@redwoodjs/core']

  const tasks = new Listr(
    [
      {
        title: 'Check prerequisites',
        skip: force,
        task: () => {
          if (!getConfig().experimental?.streamingSsr?.enabled) {
            throw new Error(
              'The Streaming SSR experimental feature must be enabled before you can setup middleware',
            )
          }
        },
      },
      addWebPackages([`@redwoodjs/ogimage-gen@${currentProjectVersion}`]),
      {
        title: 'Add OG Image middleware ...',
        task: async () => {
          const serverEntryPath = rwPaths.web.entryServer
          if (serverEntryPath === null) {
            throw new Error(
              'Could not find the server entry file. Is your project using the default structure?',
            )
          }

          const transformResult = await runTransform({
            transformPath: path.join(__dirname, 'codemod.js'),
            targetPaths: [serverEntryPath],
          })

          if (transformResult.error) {
            throw new Error(transformResult.error)
          }
        },
      },
      {
        title: 'Prettifying changes files',
        task: async (_ctx, task) => {
          const serverEntryPath = rwPaths.web.entryServer
          if (serverEntryPath === null) {
            throw new Error(
              'Could not find the server entry file. Is your project using the default structure?',
            )
          }

          try {
            const source = fs.readFileSync(serverEntryPath, 'utf-8')
            const prettierOptions = await getPrettierOptions()
            const prettifiedApp = await format(source, {
              ...prettierOptions,
              parser: 'babel-ts',
            })

            fs.writeFileSync(serverEntryPath, prettifiedApp, 'utf-8')
          } catch (error) {
            task.output =
              "Couldn't prettify the changes. Please reformat the files manually if needed."
          }
        },
      },
    ],
    { rendererOptions: { collapseSubtasks: false } },
  )

  try {
    await tasks.run()
  } catch (e: any) {
    console.error(e.message)
    process.exit(e?.exitCode || 1)
  }
}
