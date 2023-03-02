import yargs from 'yargs'

import { standardAuthBuilder } from '@redwoodjs/cli-helpers'

export const command = 'netlify'
export const description = 'Set up auth for for Netlify'

export function builder(yargs: yargs.Argv) {
  return standardAuthBuilder(yargs)
}

export interface Args {
  force: boolean
}

export async function handler(options: Args) {
  const { handler } = await import('./setupHandler')
  return handler(options)
}
