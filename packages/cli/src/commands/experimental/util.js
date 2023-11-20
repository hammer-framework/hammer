import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import terminalLink from 'terminal-link'

import { getPaths } from '../../lib'
import { isTypeScriptProject } from '../../lib/project'

const link = (topicId, isTerminal = false) => {
  const communityLink = `https://community.redwoodjs.com/t/${topicId}`
  if (isTerminal) {
    return terminalLink(communityLink, communityLink)
  } else {
    return communityLink
  }
}

export const getEpilogue = (
  command,
  description,
  topicId,
  isTerminal = false
) =>
  `This is an experimental feature to: ${description}.\n\nPlease find documentation and links to provide feedback for ${command} at:\n -> ${link(
    topicId,
    isTerminal
  )}`

export const printTaskEpilogue = (command, description, topicId) => {
  console.log(
    `${chalk.hex('#ff845e')(
      `------------------------------------------------------------------\n 🧪 ${chalk.green(
        'Experimental Feature'
      )} 🧪\n------------------------------------------------------------------`
    )}`
  )
  console.log(getEpilogue(command, description, topicId, false))

  console.log(
    `${chalk.hex('#ff845e')(
      '------------------------------------------------------------------'
    )}\n`
  )
}

export const serverFileExists = () => {
  const serverFilePath = path.join(
    getPaths().api.src,
    `server.${isTypeScriptProject() ? 'ts' : 'js'}`
  )

  return fs.existsSync(serverFilePath)
}

export const isServerFileSetup = () => {
  if (!serverFileExists) {
    throw new Error(
      'RedwoodJS Realtime requires a serverful environment. Please run `yarn rw exp setup-server-file` first.'
    )
  }

  return true
}

export const realtimeExists = () => {
  const realtimePath = path.join(
    getPaths().api.lib,
    `realtime.${isTypeScriptProject() ? 'ts' : 'js'}`
  )
  return fs.existsSync(realtimePath)
}

export const isRealtimeSetup = () => {
  if (!realtimeExists) {
    throw new Error(
      'Adding realtime events requires that RedwoodJS Realtime be setup. Please run `yarn setup realtime` first.'
    )
  }

  return true
}
