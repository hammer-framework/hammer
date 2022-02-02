// import terminalLink from 'terminal-link'
import fs from 'fs'
import path from 'path'

import Listr from 'listr'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths } from '../../../../lib'
import c from '../../../../lib/colors'
import {
  addToGitIgnoreTask,
  addFilesTask,
  addPackagesTask,
  printSetupNotes,
} from '../helpers'
import { SERVERLESS_API_YML } from '../templates/serverless/api'
import { SERVERLESS_WEB_YML } from '../templates/serverless/web'

export const command = 'serverless'
export const description = 'Setup deployments via the Serverless Framework'

export const aliases = ['aws-serverless']

export const notes = [
  `${c.green(
    "You're almost ready to deploy using the Serverless framework!"
  )}\n`,
  '• See https://redwoodjs.com/docs/deploy#serverless for more info, including ',
  'the important first deploy experience. If you want to give it a shot, run ',
  '`yarn rw deploy serverless --first-run`. For subsequent deploys you can ',
  'just run `yarn rw deploy serverless`.\n',
  '• If you want to use the serverless.com dashboard to manage your app, create ',
  'an account and then run `yarn serverless login` to add your credentials, ',
  'then run `yarn serverless` in both the`web` and `api` directories to connect your ',
  'dashboard to this app.\n',
  "• If you haven't already, familiarize yourself with the docs for your ",
  'preferred provider: https://www.serverless.com/framework/docs/providers\n',
]

const projectDevPackages = [
  'serverless',
  'serverless-lift',
  '@vercel/nft',
  'archiver',
  'fs-extra',
]

const files = [
  {
    path: path.join(getPaths().api.base, 'serverless.yml'),
    content: SERVERLESS_API_YML,
  },
  {
    path: path.join(getPaths().web.base, 'serverless.yml'),
    content: SERVERLESS_WEB_YML,
  },
]

const prismaBinaryTargetAdditions = () => {
  const content = fs.readFileSync(getPaths().api.dbSchema).toString()

  if (!content.includes('rhel-openssl-1.0.x')) {
    const result = content.replace(
      /binaryTargets =.*\n/,
      `binaryTargets = ["native", "rhel-openssl-1.0.x"]\n`
    )

    fs.writeFileSync(getPaths().api.dbSchema, result)
  }
}

// updates the api_url to use an environment variable.
const updateRedwoodTomlTask = () => {
  return {
    title: 'Updating redwood.toml apiUrl...',
    task: () => {
      const configPath = path.join(getPaths().base, 'redwood.toml')
      const content = fs.readFileSync(configPath).toString()

      const newContent = content.replace(
        /apiUrl.*?\n/m,
        'apiUrl = "${API_URL:/api}"       # Set API_URL in production to the Serverless deploy endpoint of your api service, see https://redwoodjs.com/docs/deploy/serverless#api_url\n'
      )
      fs.writeFileSync(configPath, newContent)
    },
  }
}

export const handler = async ({ force }) => {
  const tasks = new Listr(
    [
      addPackagesTask({
        packages: projectDevPackages,
        devDependency: true,
      }),
      addFilesTask({
        files,
        force,
      }),
      updateRedwoodTomlTask(),
      addToGitIgnoreTask({
        paths: ['.serverless'],
      }),
      {
        title: 'Adding necessary Prisma binaries...',
        task: () => prismaBinaryTargetAdditions(),
      },
      printSetupNotes(notes),
    ],
    {
      exitOnError: true,
    }
  )
  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
