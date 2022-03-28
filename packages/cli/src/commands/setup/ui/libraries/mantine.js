import fs, { promises as asyncfs } from 'fs'
import path from 'path'

import execa from 'execa'
import Listr from 'listr'

import { getPaths } from '../../../../lib'
import c from '../../../../lib/colors'
import {
  checkStorybookStatus,
  configureStorybook,
} from '../tasks/configure-storybook'
import { appJSContains, extendAppJS } from '../tasks/setup-component-library'

export const command = 'mantine'
export const description = 'Set up Mantine UI'

const ALL_KEYWORD = 'all'
const ALL_MANTINE_PACKAGES = [
  'core',
  'dates',
  'dropzone',
  'form',
  'hooks',
  'modals',
  'notifications',
  'prism',
  'rte',
  'spotlight',
]

const MANTINE_THEME_AND_COMMENTS = [
  '// This object will be used to override Mantine theme defaults.',
  '// See https://mantine.dev/theming/mantine-provider/#theme-object for theming options',
  'module.exports = {}',
  '', // Add a trailing newline.
]

export function builder(yargs) {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
  yargs.option('install', {
    alias: 'i',
    default: true,
    description: 'Install packages',
    type: 'boolean',
  })
  yargs.option('packages', {
    alias: 'p',
    default: ['core', 'hooks'],
    description: `Mantine packages to install. Specify '${ALL_KEYWORD}' to install all packages. Default: ['core', 'hooks']`,
    type: 'array',
  })
}

/**
 * Asynchronously creates a file at the specified path with the provided content, join()ed with '\n'
 * If overwrite is false, and the file already exists, throws `Error(alreadyExistsError)`
 * @param {string} path File path at which to create the file
 * @param {Array} contentLines Array of lines to join and write into the file.
 * @param {Boolean} overwrite Indicates if the file should be overwritten, if it already exists.
 * @param {string} alreadyExistsError Message to throw if !overwrite && file already exists.
 * // TODO: this seems like too general of a function to belong here. Where should it go?
 */
async function createFile({
  filepath,
  contentLines,
  overwrite = false,
  alreadyExistsError,
}) {
  if (fs.existsSync(filepath) && !overwrite) {
    throw new Error(alreadyExistsError)
  } else {
    return asyncfs
      .mkdir(path.dirname(filepath), { recursive: true })
      .then((_) => {
        return asyncfs.writeFile(filepath, contentLines.join('\n'), {
          flag: 'w',
        })
      })
      .catch((reason) => {
        console.error(`Failed to write ${filepath}. Reason: ${reason}`)
      })
  }
}

export async function handler({ force, install, packages }) {
  const rwPaths = getPaths()

  const installPackages = (
    packages.indexOf(ALL_KEYWORD) !== -1 ? ALL_MANTINE_PACKAGES : packages
  ).map((pack) => `@mantine/${pack}`)

  const tasks = new Listr([
    {
      title: 'Installing packages...',
      skip: () => !install,
      task: () => {
        return new Listr([
          {
            title: `Install ${installPackages.join(', ')}`,
            task: async () => {
              await execa('yarn', [
                'workspace',
                'web',
                'add',
                '-D',
                ...installPackages,
              ])
            },
          },
        ])
      },
    },
    {
      title: 'Setting up Mantine',
      skip: () => appJSContains('MantineProvider'),
      task: () =>
        extendAppJS({
          wrapTag: {
            wrapperComponent: 'MantineProvider',
            wrapperProps: { theme: 'theme' },
            wrappedComponent: 'RedwoodApolloProvider',
          },
          imports: [
            "import { MantineProvider } from '@mantine/core'",
            "import * as theme from 'config/mantine.config'",
          ],
        }),
    },
    {
      title: `Creating Theme File`,
      task: async () => {
        return createFile({
          filepath: path.join(rwPaths.web.config, 'mantine.config.js'),
          overwrite: force,
          contentLines: MANTINE_THEME_AND_COMMENTS,
          alreadyExistsError:
            'Mantine config already exists.\nUse --force to override existing config.',
        })
      },
    },
    {
      title: 'Configure Storybook...',
      skip: () => checkStorybookStatus({ force }) === 'done',
      task: async () =>
        configureStorybook('mantine.storybook.preview.js.template'),
    },
  ])

  try {
    await tasks.run()
  } catch (e) {
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
