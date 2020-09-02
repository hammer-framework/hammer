import terminalLink from 'terminal-link'

export const command = 'util <util>'
export const aliases = ['u']
export const description = 'Quality of life utilities'

export const builder = (yargs) =>
  yargs
    .commandDir('./util', { recurse: true, exclude: /util.js/ })
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface'
      )}`
    )
