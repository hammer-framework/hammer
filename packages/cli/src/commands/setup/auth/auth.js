import prompts from 'prompts'
import terminalLink from 'terminal-link'

import c from '../../../lib/colors'

export const command = 'auth <provider>'

export const description = 'Generate an auth configuration'

export async function builder(yargs) {
  const {
    setupAuthEthereumCommand,
    setupAuthGoTrueCommand,
    setupAuthMagicLinkCommand,
    setupAuthNhostCommand,
    setupAuthOktaCommand,
  } = await import('@redwoodjs/auth-providers-setup')

  // Don't forget to update test-project setup if you change something here
  const printExperimentalWarning = async (argv, yargs) => {
    if (!argv.warn) {
      return
    }

    console.log(
      c.warning(
        [
          '',
          "You're running the experimental @canary version of auth. It might",
          'be broken, and after running this command you will not be able to',
          'downgrade to a stable version of Redwood without breaking your',
          'auth setup. Please only use this version of auth in throwaway',
          'projects. For a more stable experience, but still updated with the',
          "latest patches, try switching to Redwood's @next version by",
          'running `yarn rw upgrade -t next`',
          '',
        ].join('\n')
      )
    )
    const response = await prompts({
      type: 'confirm',
      name: 'answer',
      message: 'Do you want to continue?',
      initial: false,
    })

    if (!response.answer) {
      yargs.exit(1)
    }
  }

  const setupAuthCommand = yargs
    .middleware([printExperimentalWarning])
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup-auth'
      )}`
    )
    .command(setupAuthEthereumCommand)
    .command(setupAuthGoTrueCommand)
    .command(setupAuthMagicLinkCommand)
    .command(setupAuthNhostCommand)
    .command(setupAuthOktaCommand)

  for (const module of [
    '@redwoodjs/auth-auth0-setup',
    '@redwoodjs/auth-custom-setup',
    '@redwoodjs/auth-netlify-setup',
    '@redwoodjs/auth-firebase-setup',
    '@redwoodjs/auth-azure-active-directory-setup',
    '@redwoodjs/auth-clerk-setup',
    '@redwoodjs/auth-dbauth-setup',
    '@redwoodjs/auth-supabase-setup',
    '@redwoodjs/auth-supertokens-setup',
  ]) {
    let commandModule

    try {
      commandModule = await import(module)
    } catch (e) {
      // Since these are plugins, it's ok if they can't be imported because they're not installed.
      if (e.code !== 'MODULE_NOT_FOUND') {
        throw e
      }
    }

    if (commandModule) {
      setupAuthCommand.command(commandModule)
    }
  }
}
