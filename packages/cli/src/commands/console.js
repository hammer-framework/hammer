import fs from 'fs'
import path from 'path'
import repl from 'repl'

import { registerApiSideBabelHook } from '@redwoodjs/internal'

export const command = 'console'
export const aliases = ['c']
export const description = 'Launch an interactive Redwood shell (experimental)'

export const handler = async (options) => {
  const { handler } = await import('./consoleHandler')
  return handler(options)
}
