import { execa } from 'execa'
import fs from 'node:fs'
import semver from 'semver'
import which from 'which'

import type { Config } from './config.js'

import { ExitCodeError } from './error.js'

export async function checkNodeVersion(config: Config) {
  if (config.verbose) {
    console.log('Running `node --version`')
  }

  const { stdout: version } = await execa`node --version`

  if (config.verbose) {
    console.log('Node version:', version)
  }

  if (!semver.satisfies(version, '>=20')) {
    console.error('❌Your Node.js version must be >=20')
    console.error('Plesae install or switch to a newer version of Node')
    console.error(
      'We recommend using a Node version manager like `fnm`, `nvm` or `n`',
    )
    throw new ExitCodeError(1, 'Node version too old')
  }

  console.log('✅ Node version requirements met')
}

export function checkYarnInstallation(config: Config) {
  const allYarns = which.sync('yarn', { all: true, nothrow: true })

  if (!allYarns) {
    console.error('Could not find `yarn`')
    console.error('Please enable yarn by running `corepack enable`')
    console.error(
      'and then upgrade by running `corepack install --global yarn@latest',
    )
    throw new ExitCodeError(1, 'Yarn not found')
  }

  if (config.verbose) {
    console.log('yarn path(s):', allYarns)
  }

  const yarnPath = fs.realpathSync(allYarns[0])

  if (config.verbose) {
    console.log('yarn canonical path:', yarnPath)
  }

  if (yarnPath.includes('/corepack/') || yarnPath.includes('\\corepack\\')) {
    // The first found `yarn` seems to be installed by corepack, so all is good
    console.log('✅ Yarn requirements met')
    return
  }

  // Skipping the first one, as we've already checked it further up
  for (const yarn of allYarns.slice(1)) {
    if (config.verbose) {
      console.log('Found yarn:', yarn)
    }

    if (yarn.includes('/corepack/') || yarn.includes('\\corepack\\')) {
      console.log('You have more than one active yarn installation')
      console.log("Perhaps you've manually installed it using Homebrew or npm")
      console.log(
        'Please completely uninstall yarn and then enable it using corepack',
      )
      console.log('`corepack enable`')
      console.log(
        '(yarn is already shipped with Node, you just need to enable it)',
      )
      console.log(
        "Found yarn installed by corepack, but it's not the first one in $PATH",
      )
      throw new ExitCodeError(1, 'corepack yarn is not first in $PATH')
    }
  }

  console.log("Found yarn, but it's not enabled by corepack")
  console.log('Redwood works best with yarn enabled via corepack')
  console.log(
    'Please completely uninstall yarn and then enable it using corepack',
  )
  console.log('`corepack enable`')
  throw new ExitCodeError(1, 'yarn needs to be enabled by corepack')
}
