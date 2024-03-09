/* eslint-env node */
// @ts-check

import path from 'node:path'

import { REDWOOD_FRAMEWORK_PATH } from '../actionsLib.mjs'

/**
 * @typedef {import('@actions/exec').ExecOptions} ExecOptions
 */

/**
 * Exec a command.
 * Output will be streamed to the live console.
 * Returns promise with return code
 *
 * @callback Exec
 * @param {string} commandLine command to execute (can include additional args). Must be correctly escaped.
 * @param {string[]=} args arguments for tool. Escaping is handled by the lib.
 * @param {ExecOptions=} options exec options.  See ExecOptions
 * @returns {Promise<unknown>} exit code
 */

/**
 * @callback ExecInProject
 * @param {string} commandLine command to execute (can include additional args). Must be correctly escaped.
 * @param {Omit<ExecOptions, "cwd">=} options exec options.  See ExecOptions
 * @returns {Promise<unknown>} exit code
 */

/**
 * @param {string} rscProjectPath
 * @param {Object} core
 * @param {(key: string, value: string) => void} core.setOutput
 * @param {Exec} exec
 * @param {ExecInProject} execInProject
 * @returns {Promise<void>}
 */
export async function main(
  rscProjectPath,
  core,
  exec,
  execInProject
) {
  core.setOutput('rsc-project-path', rscProjectPath)

  console.log('rwPath', REDWOOD_FRAMEWORK_PATH)
  console.log('rscProjectPath', rscProjectPath)

  await setUpRscProject(
    rscProjectPath,
    exec,
    execInProject,
  )
}

/**
 * @param {string} rscProjectPath
 * @param {Exec} exec
 * @param {ExecInProject} execInProject
 * @returns {Promise<void>}
 */
async function setUpRscProject(
  rscProjectPath,
  exec,
  execInProject,
) {
  const rwBinPath = path.join(
    REDWOOD_FRAMEWORK_PATH,
    'packages/cli/dist/index.js'
  )
  const rwfwBinPath = path.join(
    REDWOOD_FRAMEWORK_PATH,
    'packages/cli/dist/rwfw.js'
  )

  console.log(`Creating project at ${rscProjectPath}`)
  console.log()
  await exec('npx', [
    '-y',
    'create-redwood-app@canary',
    '-y',
    '--no-git',
    rscProjectPath,
  ])

  console.log(`Setting up Streaming/SSR in ${rscProjectPath}`)
  const cmdSetupStreamingSSR = `node ${rwBinPath} experimental setup-streaming-ssr -f`
  await execInProject(cmdSetupStreamingSSR)
  console.log()

  console.log(`Setting up RSC in ${rscProjectPath}`)
  await execInProject(`node ${rwBinPath} experimental setup-rsc`)
  console.log()

  console.log(`Copying over framework files to ${rscProjectPath}`)
  await execInProject(`node ${rwfwBinPath} project:copy`, {
    env: { RWFW_PATH: REDWOOD_FRAMEWORK_PATH },
  })
  console.log()

  console.log('Installing dependencies')
  await execInProject('yarn install')
  console.log()

  console.log(`Building project in ${rscProjectPath}`)
  await execInProject(`node ${rwBinPath} build -v`)
  console.log()
}
