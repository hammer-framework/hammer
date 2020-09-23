import terminalLink from 'terminal-link'
export const command = 'setup <type>'
export const description = 'Execute some setup logic'

export const builder = (yargs) =>
  yargs
    .commandDir('./setup', { recurse: true })
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#setting-up'
      )}`
    )

export const yargsDefaults = {
  force: {
    alias: 'f',
    default: false,
    description: 'Overwrite existing files',
    type: 'boolean',
  },
}
