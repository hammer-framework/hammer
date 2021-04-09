import path from 'path'

import camelcase from 'camelcase'
import Listr from 'listr'
import { paramCase } from 'param-case'
import pascalcase from 'pascalcase'
import terminalLink from 'terminal-link'

import { ensurePosixPath } from '@redwoodjs/internal'

import { generateTemplate, getPaths, writeFilesTask } from 'src/lib'
import c from 'src/lib/colors'

import { yargsDefaults } from '../generate'

/**
 * Reduces boilerplate for generating an output path and content to write to disk
 * for a component.
 */
// TODO: Make this read all the files in a template directory instead of
// manually passing in each file.
export const templateForComponentFile = ({
  name: pathSlashName,
  suffix = '',
  extension = '.js',
  webPathSection,
  apiPathSection,
  generator,
  templatePath,
  templateVars,
  componentName,
  outputPath,
}) => {
  const { name, path: componentPath = '' } = splitPathAndName(pathSlashName)

  const camelComponentPath = formatCamelPath(componentPath)

  const basePath = webPathSection
    ? getPaths().web[webPathSection]
    : getPaths().api[apiPathSection]
  const outputComponentName =
    componentName || pascalcase(paramCase(name)) + suffix
  const componentOutputPath =
    outputPath ||
    path.join(
      basePath,
      camelComponentPath,
      outputComponentName,
      outputComponentName + extension
    )
  const fullTemplatePath = path.join(generator, 'templates', templatePath)
  const content = generateTemplate(fullTemplatePath, {
    name,
    outputPath: ensurePosixPath(
      `./${path.relative(getPaths().base, componentOutputPath)}`
    ),
    ...templateVars,
  })
  return [componentOutputPath, content]
}

/**
 * Creates a route path, either returning the existing path if passed, otherwise
 * creates one based on the name. If the passed path is just a route parameter
 * a new path based on the name is created, with the parameter appended to it
 */
export const pathName = (path, name) => {
  let routePath = path

  if (path && path.startsWith('{') && path.endsWith('}')) {
    routePath = `/${paramCase(name)}/${path}`
  }

  if (!routePath) {
    routePath = `/${paramCase(name)}`
  }

  return routePath
}

/**
 * Reduces boilerplate for creating a yargs handler that writes a component to a
 * location.
 */
// TODO: Make this work for all files, not just components.
export const createYargsForComponentGeneration = ({
  componentName,
  filesFn,
  builderObj = yargsDefaults,
}) => {
  return {
    command: `${componentName} <name>`,
    description: `Generate a ${componentName} component`,
    builder: (yargs) => {
      yargs
        .positional('name', {
          description: `Name of the ${componentName}`,
          type: 'string',
        })
        .epilogue(
          `Also see the ${terminalLink(
            'Redwood CLI Reference',
            `https://redwoodjs.com/reference/command-line-interface#generate-${componentName}`
          )}`
        )
        .option('tests', {
          description: 'Generate test files',
          type: 'boolean',
          default: true,
        })
        .option('stories', {
          description: 'Generate storybook files',
          type: 'boolean',
          default: true,
        })
      Object.entries(builderObj).forEach(([option, config]) => {
        yargs.option(option, config)
      })
    },
    handler: async (options) => {
      const tasks = new Listr(
        [
          {
            title: `Generating ${componentName} files...`,
            task: async () => {
              const f = await filesFn(options)
              return writeFilesTask(f, { overwriteExisting: options.force })
            },
          },
        ],
        { collapse: false, exitOnError: true }
      )

      try {
        await tasks.run()
      } catch (e) {
        console.error(c.error(e.message))
        process.exit(e?.exitCode || 1)
      }
    },
  }
}

// Returns all relations to other models
export const relationsForModel = (model) => {
  return model.fields
    .filter((f) => f.relationName)
    .map((field) => {
      return field.name
    })
}

// Returns only relations that are of datatype Int
export const intForeignKeysForModel = (model) => {
  return model.fields
    .filter((f) => f.name.match(/Id$/) && f.type === 'Int')
    .map((f) => f.name)
}

// Splits Path and Name or Model from the command argument <path/name>
export const splitPathAndName = (pathSlashName) => {
  const path = pathSlashName.split('/').slice(0, -1).join('/') ?? ''
  // This code will work whether or not there's a path in model
  // E.g. if model is just 'post',
  // path.split('/') will return ['post'].
  const name = pathSlashName.split('/').pop()

  return { name, path }
}

// Return a camelcase formatted path from a path
export const formatCamelPath = (path) => {
  return path === '' ? path : path.split('/').map(camelcase).join('/') + '/'
}
