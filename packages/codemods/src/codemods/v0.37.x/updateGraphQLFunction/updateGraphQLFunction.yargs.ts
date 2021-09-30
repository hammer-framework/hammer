import path from 'path'

import fg from 'fast-glob'
import task from 'tasuku'

import getRWPaths from '../../../lib/getRWPaths'
import runTransform from '../../../lib/runTransform'

export const command = 'update-graphql-function'
export const description =
  '(v0.36->v0.37) Updates the imports and createGraphQLHandler in the GraphQL Function'

export const handler = () => {
  task('Updating the GraphQL Function', async () => {
    const rwPaths = getRWPaths()

    runTransform({
      transformPath: path.join(__dirname, 'updateGraphQLFunction.js'),
      targetPaths: fg.sync(path.join(rwPaths.api.functions, 'graphql.{js,ts}')),
    })
  })
}
