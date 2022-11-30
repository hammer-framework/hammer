import yargs from 'yargs'

import {
  standardAuthBuilder,
  standardAuthHandler,
} from '@redwoodjs/cli-helpers'

export const command = 'azure-active-directory'
export const description =
  'Generate an auth configuration for Azure Active Directory'

export const builder = (yargs: yargs.Argv) => {
  return standardAuthBuilder(yargs)
}

interface Args {
  rwVersion: string
  force: boolean
}

export const handler = async ({ rwVersion, force: forceArg }: Args) => {
  standardAuthHandler({
    basedir: __dirname,
    rwVersion,
    forceArg,
    provider: 'azureActiveDirectory',
    authDecoderImport:
      "import { authDecoder } from '@redwoodjs/auth-azure-active-directory-api'",
    apiPackages: ['@redwoodjs/auth-azure-active-directory-api'],
    webPackages: [
      '@redwoodjs/auth-azure-active-directory-web',
      '@azure/msal-browser',
    ],
    notes: [
      'You will need to create several environment variables with your Azure',
      'AD config options. Check out web/src/App.{js,tsx} for the variables',
      'you need to add.',
      '\n',
      'RedwoodJS specific Documentation:',
      'https://redwoodjs.com/docs/authentication#azure-ad',
      '\n',
      'MSAL.js Documentation:',
      'https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications',
    ],
  })
}
