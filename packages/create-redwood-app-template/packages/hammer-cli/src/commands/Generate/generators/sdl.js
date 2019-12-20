import path from 'path'

import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'
import { getDMMF } from '@prisma/sdk'

import { readFile, generateTemplate } from 'src/lib'

const OUTPUT_PATH = path.join('api', 'src', 'graphql')
const SCHEMA_PATH = path.join('api', 'prisma', 'schema.prisma')
const IGNORE_FIELDS = ['id', 'createdAt']

const modelFieldToSDL = (field, required = true) => {
  return `${field.name}: ${field.type}${
    field.isRequired && required ? '!' : ''
  }`
}

const querySDL = (fields) => {
  return fields.map((field) => modelFieldToSDL(field))
}

const inputSDL = (fields) => {
  return fields
    .filter((field) => {
      return IGNORE_FIELDS.indexOf(field.name) === -1
    })
    .map((field) => modelFieldToSDL(field, false))
}

const sdlFromSchemaModel = async (name) => {
  const metadata = await getDMMF({
    datamodel: readFile(SCHEMA_PATH).toString(),
  })

  const model = metadata.datamodel.models.find((model) => {
    return model.name === name
  })

  if (model) {
    return {
      query: querySDL(model.fields).join('\n    '),
      input: inputSDL(model.fields).join('\n    '),
    }
  } else {
    throw `no schema definition found for \`${name}\``
  }
}

const files = async (args) => {
  const [[sdlName, ...rest], flags] = args
  const typeName = pascalcase(sdlName)
  const serviceName = pluralize(typeName)
  const serviceFileName = camelcase(serviceName)
  const queryAllName = camelcase(serviceName)
  const outputPath = path.join(OUTPUT_PATH, `${serviceFileName}.sdl.js`)
  const { query, input } = await sdlFromSchemaModel(typeName)
  const template = generateTemplate(path.join('sdl', 'sdl.js.template'), {
    typeName,
    serviceName,
    serviceFileName,
    queryAllName,
    query,
    input,
  })

  return { [outputPath]: template }
}

// also create a service for the SDL to automap to resolvers
const generate = (args) => {
  console.info('generate args', args)
  return [[['service', ...args[0]], args[1]]]
}

export default {
  name: 'SDL',
  command: 'sdl',
  description: 'Generates a GraphQL SDL file and Hammer service object',
  files: async (args) => await files(args),
  generate: (args) => generate(args),
}
