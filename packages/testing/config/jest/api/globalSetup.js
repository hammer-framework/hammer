const { getSchema } = require('@prisma/internals')

const { getPaths } = require('@redwoodjs/project-config')

const {
  getDefaultDb,
  checkAndReplaceDirectUrl,
} = require('../../../dist/api/directUrlHelpers')

const rwjsPaths = getPaths()

module.exports = async function () {
  if (process.env.SKIP_DB_PUSH !== '1') {
    const process = require('process')
    // Load dotenvs
    require('dotenv-defaults/config')

    const defaultDb = getDefaultDb(rwjsPaths.base)

    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || defaultDb

    const prismaSchema = (await getSchema(rwjsPaths.api.dbSchema)).toString()

    const directUrlEnvVar = checkAndReplaceDirectUrl(prismaSchema, defaultDb)

    const command =
      process.env.TEST_DATABASE_STRATEGY === 'reset'
        ? ['prisma', 'migrate', 'reset', '--force', '--skip-seed']
        : ['prisma', 'db', 'push', '--force-reset', '--accept-data-loss']

    const execa = require('execa')
    execa.sync(`yarn rw`, command, {
      cwd: rwjsPaths.api.base,
      stdio: 'inherit',
      shell: true,
      env: {
        DATABASE_URL: process.env.DATABASE_URL,
        [directUrlEnvVar]: process.env[directUrlEnvVar],
      },
    })
  }
}
