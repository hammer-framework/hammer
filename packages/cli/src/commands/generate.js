import terminalLink from 'terminal-link'
export const command = 'generate <type>'
export const aliases = ['g']
export const description = 'Save time by generating boilerplate code'

export const builder = (yargs) =>
  yargs
    /**
     * Like generate, util is an entry point command,
     * so we can't have generate going through its subdirectories
     */
    .commandDir('./generate', { recurse: true, exclude: /\/util\// })
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#generate-alias-g'
      )}`
    )

export const yargsDefaults = {
  force: {
    alias: 'f',
    default: false,
    description: 'Overwrite existing files',
    type: 'boolean',
  },
  javascript: {
    alias: 'js',
    default: true,
    description: 'Generate JavaScript files',
    type: 'boolean',
  },
  typescript: {
    alias: 'ts',
    default: false,
    description: 'Generate TypeScript files',
    type: 'boolean',
  },
}
