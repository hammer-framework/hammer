/* eslint-env node */
// @ts-check

import os from 'node:os'
import path from 'node:path'

import execa from 'execa'

import { main } from './setUpRscProject.mjs'

class ExecaError extends Error {
  stdout
  stderr
  exitCode

  constructor({ stdout, stderr, exitCode }) {
    super(`execa failed with exit code ${exitCode}`)
    this.stdout = stdout
    this.stderr = stderr
    this.exitCode = exitCode
  }
}

/**
 * @template [EncodingType=string]
 * @typedef {import('execa').Options<EncodingType>} ExecaOptions<T>
 */

/**
 * @typedef {{
 *   env?: Record<string, string>
 * }} ExecOptions
 */

/**
 * @param {string} commandLine command to execute (can include additional args). Must be correctly escaped.
 * @param {string[]=} args arguments for tool. Escaping is handled by the lib.
 * @param {ExecOptions=} options exec options.  See ExecOptions
 */
async function exec(commandLine, args, options) {
  return execa(commandLine, args, options)
    .then(({ stdout, stderr, exitCode }) => {
      if (exitCode !== 0) {
        throw new ExecaError({ stdout, stderr, exitCode })
      }
    })
    .catch((error) => {
      if (error instanceof ExecaError) {
        // Rethrow ExecaError
        throw error
      } else {
        const { stdout, stderr, exitCode } = error
        console.log('error', error)
        throw new ExecaError({ stdout, stderr, exitCode })
      }
    })
}

/**
 * @param {string} cwd
 * @param {Record<string, string>=} env
 * @returns {ExecaOptions<string>}
 */
function getExecaOptions(cwd, env = {}) {
  return {
    shell: true,
    stdio: 'inherit',
    cleanup: true,
    cwd,
    env,
  }
}

const rscProjectPath = path.join(
  os.tmpdir(),
  'rsc-project',
  // ":" is problematic with paths
  new Date().toISOString().split(':').join('-')
)

// Mock for @actions/core
const core = {
  setOutput: () => {},
}

// Mock for @actions/cache
const cache = {
  saveCache: async () => 1,
  restoreCache: async () => undefined,
}

const dependenciesKey = 'rsc-project-dependency-key'
const distKey = 'rsc-dist-key'

/**
 * Exec a command.
 * Output will be streamed to the live console.
 * Returns promise with return code
 *
 * @param {string} commandLine command to execute (can include additional args). Must be correctly escaped.
 * @param {ExecOptions=} options exec options.  See ExecOptions
 * @returns {Promise<unknown>} exit code
 */
function execInProject(commandLine, options) {
  return exec(
    commandLine,
    undefined,
    getExecaOptions(rscProjectPath, options?.env)
  )
}

/**
 * Exec a command.
 * Output will be streamed to the live console.
 * Returns promise with return code
 *
 * @param {string} commandLine command to execute (can include additional args). Must be correctly escaped.
 * @param {string[]=} args arguments for tool. Escaping is handled by the lib.
 * @param {ExecOptions=} options exec options.  See ExecOptions
 * @returns {Promise<unknown>} exit code
 */
function execInRoot(commandLine, args, options) {
  return exec(commandLine, args, getExecaOptions('/', options?.env))
}

main(
  rscProjectPath,
  core,
  dependenciesKey,
  distKey,
  cache,
  execInRoot,
  execInProject
)
