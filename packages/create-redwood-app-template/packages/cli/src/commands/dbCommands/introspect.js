import { getPaths, runCommandTask } from 'src/lib'

export const command = 'introspect'
export const desc =
  'Introspect your database and generate the models in api/prisma/schema.prisma (overwrites existing models).'
export const builder = {
  verbose: { type: 'boolean', default: true, alias: ['v'] },
}

export const handler = async ({ verbose = true }) => {
  return await runCommandTask(
    [
      {
        title: 'Introspecting your database...',
        cmd: 'yarn prisma',
        args: ['introspect'],
        opts: { cwd: getPaths().api.db },
      },
    ],
    {
      verbose,
    }
  )
}
