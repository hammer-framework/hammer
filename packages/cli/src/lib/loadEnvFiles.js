// @ts-check

import path from 'path'

import { config as dotenvConfig } from 'dotenv'
import { config as dotenvDefaultsConfig } from 'dotenv-defaults'
import fs from 'fs-extra'
import { hideBin, Parser } from 'yargs/helpers'

import { getPaths } from '@redwoodjs/project-config'

export function loadEnvFiles() {
  if (process.env.REDWOOD_ENV_FILES_LOADED) {
    return
  }

  const { base } = getPaths()

  loadDefaultEnvFiles(base)
  loadNodeEnvDerivedEnvFile(base)

  const { addEnvFiles } = Parser(hideBin(process.argv), {
    array: ['add-env-files'],
    default: {
      addEnvFiles: [],
    },
  })
  if (addEnvFiles.length > 0) {
    loadUserSpecifiedEnvFiles(base, addEnvFiles)
  }

  process.env.REDWOOD_ENV_FILES_LOADED = 'true'
}

/**
 * @param {string} cwd
 */
export function loadDefaultEnvFiles(cwd) {
  dotenvDefaultsConfig({
    path: path.join(cwd, '.env'),
    defaults: path.join(cwd, '.env.defaults'),
    multiline: true,
  })
}

/**
 * @param {string} cwd
 */
export function loadNodeEnvDerivedEnvFile(cwd) {
  if (!process.env.NODE_ENV) {
    return
  }

  const nodeEnvDerivedEnvFilePath = path.join(
    cwd,
    `.env.${process.env.NODE_ENV}`
  )
  if (!fs.existsSync(nodeEnvDerivedEnvFilePath)) {
    return
  }

  dotenvConfig({ path: nodeEnvDerivedEnvFilePath, override: true })
}

/**
 * @param {string} cwd
 */
export function loadUserSpecifiedEnvFiles(cwd, addEnvFiles) {
  for (const suffix of addEnvFiles) {
    const envPath = path.join(cwd, `.env.${suffix}`)
    if (!fs.pathExistsSync(envPath)) {
      throw new Error(
        `Couldn't find an .env file at '${envPath}' as specified by '--add-env-files'`
      )
    }

    dotenvConfig({ path: envPath, override: true })
  }
}
