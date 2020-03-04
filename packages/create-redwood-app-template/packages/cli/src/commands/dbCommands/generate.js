import { runCommandTask } from 'src/lib'

export const command = 'generate'
export const desc = 'Generate the Prisma client.'
export const builder = {
  verbose: { type: 'boolean', default: true, alias: ['v'] },
}
export const handler = async ({ verbose }) => {
  return await runCommandTask(
    [
      {
        title: 'Generating the Prisma client...',
        cmd: 'prisma2',
        args: ['generate'],
      },
    ],
    {
      verbose,
    }
  )
}
