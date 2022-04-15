import fs from 'fs'
import path from 'path'

import execa from 'execa'
import { outputFileSync } from 'fs-extra'
import Listr from 'listr'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths } from '../../../../lib'
import c from '../../../../lib/colors'

export const command = 'windicss'
export const aliases = ['windi']
export const description = 'Set up WindiCSS'
export const builder = (yargs) => {
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
}

const windiImportsExist = (appTsx) => appTsx.match(/^import 'windi\.css'$/m)

export const handler = async ({ force, install }) => {
  const rwPaths = getPaths()

  const packages = ['windicss-webpack-plugin', 'windicss']

  const tasks = new Listr([
    {
      title: 'Installing packages...',
      skip: () => !install,
      task: () => {
        return new Listr([
          {
            title: `Install ${packages.join(', ')}`,
            task: async () => {
              await execa('yarn', [
                'workspace',
                'web',
                'add',
                '-D',
                ...packages,
              ])
            },
          },
        ])
      },
    },
    {
      title: 'Setup Webpack...',
      task: () => {
        return new Listr([
          {
            title: 'Setup Webpack',
            task: async () => {
              await execa('yarn', [
                'redwood',
                'setup',
                'webpack'
              ])
            },
          },
          {
            title: 'Configure WindiCSS',
            task: async () => {
              const webpackConfigPath = path.join(
                rwPaths.web.config,
                'webpack.config.js'
              )
              const webpackConfig = fs.readFileSync(webpackConfigPath, 'utf-8')
              const newWebpackConfig = `const WindiCSSWebpackPlugin = require('windicss-webpack-plugin')\n`
                + webpackConfig.replace(
                  '// config.plugins.push(YOUR_PLUGIN)',
                  '// config.plugins.push(YOUR_PLUGIN)\n  config.plugins.push(new WindiCSSWebpackPlugin())'
                )
              fs.writeFileSync(webpackConfigPath, newWebpackConfig)
            },
          },
        ])
      },
    },
    {
      title: 'Initializing WindiCSS...',
      task: async () => {
        const windiConfigPath = path.join(
          rwPaths.web.config,
          'windi.config.js'
        )

        if (fs.existsSync(windiConfigPath)) {
          if (force) {
            fs.unlinkSync(windiConfigPath)
          } else {
            throw new Error(
              'Windicss config already exists.\nUse --force to override existing config.'
            )
          }
        }

        const windiConfig = `
          import { defineConfig } from 'windicss/helpers'

          export default defineConfig({
            extract: {
              include: ['**/*.{jsx,tsx,css}'],
              exclude: ['node_modules', '.git'],
            },
          })
        `.split('\n').map((line) => line.trim()).join('\n')
        fs.writeFileSync(windiConfigPath, windiConfig)
      },
    },
    {
      title: 'Adding import to App.tsx...',
      task: (_ctx, task) => {
        const APP_TSX_PATH = path.join(rwPaths.web.src, 'App.tsx')
        const appTsx = fs.readFileSync(APP_TSX_PATH, 'utf-8')

        if (windiImportsExist(appTsx)) {
          task.skip('Imports already exist in App.tsx')
        } else {
          const newAppTsx = `import 'windi.css'\n` + appTsx
          fs.writeFileSync(APP_TSX_PATH, newAppTsx)
        }
      },
    },
  ])

  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
