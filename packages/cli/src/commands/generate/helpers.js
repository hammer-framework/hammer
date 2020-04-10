import path from 'path'

import camelcase from 'camelcase'
import pluralize from 'pluralize'
import Listr from 'listr'
import pascalcase from 'pascalcase'
import { paramCase } from 'param-case'

import { generateTemplate, getPaths, writeFilesTask } from 'src/lib'
import c from 'src/lib/colors'

/**
 * Reduces boilerplate for generating an output path and content to write to disk
 * for a component.
 */
// TODO: Make this read all the files in a template directory instead of
// manually passing in each file.
export const templateForComponentFile = ({
  name,
  suffix = '',
  extension = '.js',
  webPathSection,
  apiPathSection,
  generator,
  templatePath,
  templateVars,
  componentName,
}) => {
  const basePath = webPathSection
    ? getPaths().web[webPathSection]
    : getPaths().api[apiPathSection]
  const outputComponentName =
    componentName || pascalcase(paramCase(name)) + suffix
  const outputPath = path.join(
    basePath,
    outputComponentName,
    outputComponentName + extension
  )
  const content = generateTemplate(
    path.join(generator, 'templates', templatePath),
    {
      name,
      outputPath: `./${path.relative(getPaths().base, outputPath)}`,
      ...templateVars,
    }
  )
  return [outputPath, content]
}

/**
 * Creates a route path, either returning the existing path if passed, otherwise
 * creates one based on the name
 */
export const pathName = (path, name) => {
  return path ?? `/${paramCase(name)}`
}

/**
 * Reduces boilerplate for creating a yargs handler that writes a component to a
 * location.
 */
// TODO: Make this work for all files, not just components.
export const createYargsForComponentGeneration = ({
  componentName,
  filesFn,
}) => {
  return {
    command: `${componentName} <name>`,
    desc: `Generate a ${componentName} component.`,
    builder: { force: { type: 'boolean', default: false } },
    handler: async ({ force, ...rest }) => {
      const tasks = new Listr(
        [
          {
            title: `Generating ${componentName} files...`,
            task: async () => {
              const f = await filesFn(rest)
              return writeFilesTask(f, { overwriteExisting: force })
            },
          },
        ],
        { collapse: false, exitOnError: true }
      )

      try {
        await tasks.run()
      } catch (e) {
        console.log(c.error(e.message))
      }
    },
  }
}

// Returns all relations to other models
export const relationsForModel = (model) => {
  return model.fields
    .filter((f) => f.relationName)
    .map((field) => {
      const relationName = camelcase(field.type)
      return field.isList ? pluralize(relationName) : relationName
    })
}

// Returns only relations that are of datatype Int
export const intForeignKeysForModel = (model) => {
  return model.fields
    .filter((f) => f.name.match(/Id$/) && f.type === 'Int')
    .map((f) => f.name)
}
