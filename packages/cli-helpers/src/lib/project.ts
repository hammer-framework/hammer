import fs from 'fs'
import path from 'path'

import { resolveFile, findUp } from '@redwoodjs/project-config'

import { colors } from './colors'
import { getPaths } from './paths'

export const getGraphqlPath = () => {
  return resolveFile(path.join(getPaths().api.functions, 'graphql'))
}

export const graphFunctionDoesExist = () => {
  const graphqlPath = getGraphqlPath()
  return graphqlPath && fs.existsSync(graphqlPath)
}

export const isTypeScriptProject = () => {
  const paths = getPaths()
  return (
    fs.existsSync(path.join(paths.web.base, 'tsconfig.json')) ||
    fs.existsSync(path.join(paths.api.base, 'tsconfig.json'))
  )
}

export const getInstalledRedwoodVersion = () => {
  try {
    const packageJson = require('../../package.json')
    return packageJson.version
  } catch (e) {
    console.error(colors.error('Could not find installed redwood version'))
    process.exit(1)
  }
}

export const addEnvVarTask = (name: string, value: string, comment: string) => {
  return {
    title: `Adding ${name} var to .env...`,
    task: () => {
      const envPath = path.join(getPaths().base, '.env')
      const content = [comment && `# ${comment}`, `${name}=${value}`, ''].flat()
      let envFile = ''

      if (fs.existsSync(envPath)) {
        envFile = fs.readFileSync(envPath).toString() + '\n'
      }

      fs.writeFileSync(envPath, envFile + content.join('\n'))
    },
  }
}

/**
 * This sets the `RWJS_CWD` env var to the redwood project directory. This is typically required for internal
 * redwood packages to work correctly. For example, `@redwoodjs/project-config` uses this when reading config
 * or paths.
 *
 * @param cwd Explicitly set the redwood cwd. If not set, we'll try to determine it automatically. You likely
 * only want to set this based on some specific input, like a CLI flag.
 */
export const setRedwoodCWD = (cwd?: string) => {
  // Get the existing `cwd` from the `RWJS_CWD` env var, if it exists.
  cwd ??= process.env.RWJS_CWD

  if (cwd) {
    // `cwd` was specifically passed in or the `RWJS_CWD` env var. In this case,
    // we don't want to find up for a `redwood.toml` file. The `redwood.toml` should just be in that directory.
    if (!fs.existsSync(path.join(cwd, 'redwood.toml'))) {
      throw new Error(`Couldn't find a "redwood.toml" file in ${cwd}`)
    }
  } else {
    // `cwd` wasn't set. Odds are they're in a Redwood project,
    // but they could be in ./api or ./web, so we have to find up to be sure.
    const redwoodTOMLPath = findUp('redwood.toml', process.cwd())
    if (!redwoodTOMLPath) {
      throw new Error(
        `Couldn't find up a "redwood.toml" file from ${process.cwd()}`
      )
    }
    if (redwoodTOMLPath) {
      cwd = path.dirname(redwoodTOMLPath)
    }
  }

  process.env.RWJS_CWD = cwd
}
