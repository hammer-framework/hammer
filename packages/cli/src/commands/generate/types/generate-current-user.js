import path from 'path'

import { getProject } from '@redwoodjs/structure'

const project = getProject()

function generateTypeDef(filename, contents) {
  const { host } = project
  host.writeFileSync(path.join(host.paths.types, filename), contents)
}

export function generateCurrentUserTypes() {
  generateTypeDef(
    'currentUser.d.ts',
    project.host.readFileSync(
      path.join(__dirname, './templates/currentUser.d.ts.template')
    )
  )
}
