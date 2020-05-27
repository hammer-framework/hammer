import fs from 'fs'
import path from 'path'

import concurrently from 'concurrently'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'

export const command = 'dev [app..]'
export const desc = 'Run development servers for db, api, and web.'
export const builder = {
  app: { choices: ['db', 'api', 'web'], default: ['db', 'api', 'web'] },
}

export const handler = async ({ app = ['db', 'api', 'web'] }) => {
  // We use BASE_DIR when we need to effectively set the working dir
  const BASE_DIR = getPaths().base
  // For validation, e.g. dirExists?, we use these
  // note: getPaths().web|api.base returns undefined on Windows
  const API_DIR_SRC = getPaths().api.src
  const WEB_DIR_SRC = getPaths().web.src
  const PRISMA_SCHEMA = getPaths().api.dbSchema

  const jobs = {
    api: {
      name: 'api',
      command: `cd "${path.join(BASE_DIR, 'api')}" && yarn dev-server`,
      prefixColor: 'cyan',
      runWhen: () => fs.existsSync(API_DIR_SRC),
    },
    db: {
      name: ' db', // prefixed with ` ` to match output indentation.
      command: `cd "${path.join(
        BASE_DIR,
        'api'
      )}" && yarn prisma generate --watch`,
      prefixColor: 'magenta',
      runWhen: () => fs.existsSync(PRISMA_SCHEMA),
    },
    web: {
      name: 'web',
      command: `cd "${path.join(
        BASE_DIR,
        'web'
      )}" && yarn webpack-dev-server --config ../node_modules/@redwoodjs/core/config/webpack.development.js`,
      prefixColor: 'blue',
      runWhen: () => fs.existsSync(WEB_DIR_SRC),
    },
  }

  concurrently(
    Object.keys(jobs)
      .map((n) => app.includes(n) && jobs[n])
      .filter((job) => job && job.runWhen()),
    {
      restartTries: 3,
      prefix: '{time} {name} |',
      timestampFormat: 'HH:mm:ss',
    }
  ).catch((e) => {
    console.log(c.error(e.message))
  })
}
