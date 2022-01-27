/* eslint-env node, es2021 */
/**
 * Notes
 * - branch already exists? start on the "update package versions" step
 * - consider using xstate
 */
import c from 'ansi-colors'
import boxen from 'boxen'
import prompts from 'prompts'
import { $ } from 'zx'

import generateReleaseNotes from './generateReleaseNotes.mjs'
import updateNextReleasePullRequestsMilestone, {
  closeMilestone,
} from './updateNextReleasePullRequestsMilestone.mjs'

export const ASK = c.bgBlue(c.black('  ASK  '))
export const CHECK = c.bgYellow(c.black(' CHECK '))
export const FIX = c.bgRed(c.black('  FIX  '))

export default async function release() {
  const { semver } = await exitOnCancelPrompts({
    type: 'select',
    name: 'semver',
    message: `${ASK} Which semver are you releasing?`,
    choices: [{ value: 'major' }, { value: 'minor' }, { value: 'patch' }],
    initial: 2,
  })

  // Get the most-recent tag and get the next version from it.
  // `git describe --abbrev=0` should output something like like `v0.42.1`.
  const gitDescribePO = await $`git describe --abbrev=0`
  const previousVersion = gitDescribePO.stdout.trim()
  let nextVersion = getNextVersion(semver, previousVersion)

  // Confirm that we got the next version right; give the user a chance to correct it if we didn't.
  const nextVersionConfirmed = await confirm(
    `${CHECK} The next release is ${c.green(nextVersion)}`
  )
  if (!nextVersionConfirmed) {
    const answer = await exitOnCancelPrompts({
      type: 'text',
      name: 'nextVersion',
      message: `${ASK} enter the next version`,
    })
    nextVersion = answer.nextVersion
  }

  // Check that the git tag doesn't already exist.
  const gitTagPO = await $`git tag -l ${nextVersion}`
  if (gitTagPO.stdout.trim()) {
    console.log(
      c.bold(
        `${c.red('\u2716')} ${FIX} Git tag ${c.green(
          nextVersion
        )} already exists locally. You must resolve this before proceeding`
      )
    )
    return
  }

  const shouldUpdateNextReleasePRsMilestone = await confirm(
    `${ASK} Do you want to update next-release PRs' milestone to ${c.green(
      nextVersion
    )}?`
  )

  let milestone

  if (shouldUpdateNextReleasePRsMilestone) {
    try {
      milestone = await updateNextReleasePullRequestsMilestone(nextVersion)
    } catch (e) {
      console.log(
        `Couldn't update next-release PRs milestone to ${nextVersion}`
      )
      console.log(e)
    }
  }

  switch (semver) {
    case 'major':
      {
        console.log(c.yellow('Wait till after v1!'))
      }
      break
    case 'minor':
      await releaseMinor(nextVersion)
      break
    case 'patch':
      await releasePatch(previousVersion, nextVersion)
      break
  }

  console.log(rocketBoxen(`Released ${c.green(nextVersion)}`))

  const shouldGenerateReleaseNotes = await confirm(
    `${ASK} Do you want to generate release notes?`
  )
  if (shouldGenerateReleaseNotes) {
    try {
      await generateReleaseNotes(nextVersion)
    } catch (e) {
      console.log("Couldn't generate release notes")
      console.log(e)
    }
  }

  if (milestone) {
    const okToClose = await confirm(
      `${ASK} Ok to close milestone ${c.green(nextVersion)}?`
    )
    if (okToClose) {
      closeMilestone(milestone.number)
    }
  }
}

// Helpers

/**
 * Take the output from `git describe --abbrev=0` (which is something like `'v0.42.1'`),
 * and return an array of numbers ([0, 42, 1]).
 *
 * @param {string} version the version string (obtain by running `git describe --abbrev=0`)
 * @returns [string, string, string]
 */
function parseGitTag(version) {
  if (version.startsWith('v')) {
    version = version.substring(1)
  }

  return version.split('.').map(Number)
}

/**
 * Bump the version according to the semver we're releasing.
 *
 * @typedef {'major' | 'minor' | 'patch'} Semver
 * @param {Semver} semver
 * @param {string} previousVersion
 */
function getNextVersion(semver, previousVersion) {
  switch (semver) {
    case 'major': {
      const [major] = parseGitTag(previousVersion)
      return `v${[major + 1, 0, 0].join('.')}`
    }
    case 'minor': {
      const [major, minor] = parseGitTag(previousVersion)
      return `v${[major, minor + 1, 0].join('.')}`
    }
    case 'patch': {
      const [major, minor, patch] = parseGitTag(previousVersion)
      return `v${[major, minor, patch + 1].join('.')}`
    }
  }
}

/**
 * Wrapper around `prompts` to exit on crtl c.
 *
 * @template Name
 * @param {import('prompts').PromptObject<Name>} promptsObject
 * @param {import('prompts').Options} promptsOptions
 */
function exitOnCancelPrompts(promptsObject, promptsOptions) {
  return prompts(promptsObject, {
    ...promptsOptions,
    onCancel: () => process.exit(1),
  })
}

/**
 * Wrapper around confirm type `prompts`.
 *
 * @param {string} message
 * @returns {Promise<boolean>}
 */
export async function confirm(message) {
  const answer = await exitOnCancelPrompts({
    type: 'confirm',
    name: 'confirm',
    message,
  })

  return answer.confirm
}

/**
 * Right now releasing a major is the same as releasing a minor.
 *
 * @param {string} nextVersion
 */
// function releaseMajor(nextVersion) {
//   return releaseMajorOrMinor('major', nextVersion)
// }

/**
 * @param {string} nextVersion
 */
function releaseMinor(nextVersion) {
  return releaseMajorOrMinor('minor', nextVersion)
}

/**
 * @param {Semver} semver
 * @param {string} nextVersion
 */
async function releaseMajorOrMinor(semver, nextVersion) {
  const PO = await $`git branch --show-current`
  const branch = PO.stdout.trim()
  if (branch !== 'main') {
    console.log('Not on main. Checking out main')
    await $`git checkout main`
  }

  const releaseBranch = ['release', semver, nextVersion].join('/')
  const okToCheckout = await confirm(
    `${ASK} Ok to checkout new branch ${c.green(releaseBranch)}?`
  )
  if (!okToCheckout) {
    return
  }
  await $`git checkout -b ${releaseBranch}`

  const okToProceed = await confirm(
    `${ASK} Checked out new release branch ${c.green(
      releaseBranch
    )}.\nIf you want to continue publishing, proceed.\nOtherwise, stop here to publish this branch to GitHub to create an RC`
  )
  if (!okToProceed) {
    return
  }

  const okToCleanInstallUpdate = await confirm(
    `${ASK} Ok to clean, install, and update package versions?`
  )
  if (!okToCleanInstallUpdate) {
    return
  }

  await $`git clean -fxd`
  await $`yarn install`
  await $`./tasks/update-package-versions ${nextVersion}`
  const versionsLookRight = await confirm(
    `${CHECK} The package versions have been updated. Does everything look right?`
  )
  if (!versionsLookRight) {
    return
  }

  const commitTagQA = await confirm(
    `${ASK} Ok to commit, tag, and run through local QA?`
  )
  if (!commitTagQA) {
    return
  }

  await $`git commit -am "${nextVersion}"`
  await $`git tag -am ${nextVersion} "${nextVersion}"`
  // QA
  await $`yarn build`
  await $`yarn lint`
  await $`yarn test`

  const okToRelease = await confirm(
    `${ASK} Everything passed local QA. Are you ready to push your branch to GitHub and publish to NPM?`
  )
  if (!okToRelease) {
    return
  }
  // await $`git push && git push --tags`
  // await $`yarn lerna publish from-package`
}

/**
 * This is a WIP.
 *
 * @param {string} nextVersion
 */
async function releasePatch(previousVersion, nextVersion) {
  await $`git checkout tags/${previousVersion} -b release/patch/${nextVersion}`

  await $`git push origin release/patch/${nextVersion}`
  await `open https://github.com/redwoodjs/redwood/compare/${previousVersion}..release/patch/${nextVersion}`

  const diffLooksGood = await confirm('Does the diff look good?')

  if (!diffLooksGood) {
    console.log('Resetting...')
  }

  const proceed = await confirm('Cherry pick and handle the conflicts')

  if (!proceed) {
    console.log('Resetting...')
  }

  await $`git push origin release/patch/${nextVersion}`
  await `open https://github.com/redwoodjs/redwood/compare/${previousVersion}..release/patch/${nextVersion}`

  const diffLooksGood2 = await confirm('Does the diff look good?')

  if (!diffLooksGood2) {
    console.log('Resetting...')
  }

  // publish rc

  await $`git clean -fxd`
  await $`yarn install`

  await $`./tasks/update-package-versions ${nextVersion}`

  await $`yarn build`

  await $`git commit -am "${nextVersion}"`
  await $`git tag -am ${nextVersion} "${nextVersion}"`

  await $`git checkout main`
  // merge commit
  await $`git branch -d release/patch/${nextVersion}`
}

/**
 * @param {string} message
 */
function rocketBoxen(message) {
  boxen(message, {
    padding: 1,
    margin: 1,
    borderStyle: {
      bottomLeft: '🚀',
      bottomRight: '🚀',
      horizontal: '—',
      topLeft: '🚀',
      topRight: '🚀',
      vertical: '🚀',
    },
  })
}
