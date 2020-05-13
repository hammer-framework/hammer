import fs from 'fs'
import path from 'path'

import Listr from 'listr'
import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'
import { paramCase } from 'param-case'
import humanize from 'humanize-string'

import {
  generateTemplate,
  templateRoot,
  readFile,
  writeFile,
  asyncForEach,
  getSchema,
  getPaths,
  writeFilesTask,
  addRoutesToRouterTask,
} from 'src/lib'
import c from 'src/lib/colors'

import { relationsForModel, intForeignKeysForModel } from '../helpers'
import { files as sdlFiles } from '../sdl/sdl'
import { files as serviceFiles } from '../service/service'

const NON_EDITABLE_COLUMNS = ['id', 'createdAt', 'updatedAt']
const ASSETS = fs.readdirSync(
  path.join(templateRoot, 'scaffold', 'templates', 'assets')
)
const LAYOUTS = fs.readdirSync(
  path.join(templateRoot, 'scaffold', 'templates', 'layouts')
)
const PAGES = fs.readdirSync(
  path.join(templateRoot, 'scaffold', 'templates', 'pages')
)
const COMPONENTS = fs.readdirSync(
  path.join(templateRoot, 'scaffold', 'templates', 'components')
)
const SCAFFOLD_STYLE_PATH = './scaffold.css'
// Any assets that should not trigger an overwrite error and require a --force
const SKIPPABLE_ASSETS = ['scaffold.css']

const getIdType = (model) => {
  return model.fields.find((field) => field.isId)?.type
}

export const files = async ({ model: name, path: scaffoldPath = '' }) => {
  const model = await getSchema(pascalcase(pluralize.singular(name)))

  return {
    ...(await sdlFiles({ name, crud: true })),
    ...(await serviceFiles({
      name,
      crud: true,
      relations: relationsForModel(model),
    })),
    ...assetFiles(name),
    ...layoutFiles(name, scaffoldPath),
    ...pageFiles(name, scaffoldPath),
    ...(await componentFiles(name, scaffoldPath)),
  }
}

const assetFiles = (name) => {
  let fileList = {}

  ASSETS.forEach((asset) => {
    const outputAssetName = asset.replace(/\.template/, '')
    const outputPath = path.join(getPaths().web.src, outputAssetName)

    // skip assets that already exist on disk, never worry about overwriting
    if (
      !SKIPPABLE_ASSETS.includes(path.basename(outputPath)) ||
      !fs.existsSync(outputPath)
    ) {
      const template = generateTemplate(
        path.join('scaffold', 'templates', 'assets', asset),
        {
          name,
        }
      )
      fileList[outputPath] = template
    }
  })

  return fileList
}

const layoutFiles = (name, scaffoldPath = '') => {
  const pluralName = pascalcase(pluralize(name))
  const singularName = pascalcase(pluralize.singular(name))
  let fileList = {}

  const pascalScaffoldPath =
    scaffoldPath === ''
      ? scaffoldPath
      : scaffoldPath.split('/').map(pascalcase).join('/') + '/'

  const pluralCamelName = camelcase(pluralName)
  const camelScaffoldPath = camelcase(pascalcase(scaffoldPath))

  const pluralRouteName =
    scaffoldPath === '' ? pluralCamelName : `${camelScaffoldPath}${pluralName}`

  const newRouteName =
    scaffoldPath === ''
      ? `new${singularName}`
      : `${camelScaffoldPath}New${singularName}`

  LAYOUTS.forEach((layout) => {
    const outputLayoutName = layout
      .replace(/Names/, pluralName)
      .replace(/Name/, singularName)
      .replace(/\.template/, '')
    const outputPath = path.join(
      getPaths().web.layouts,
      pascalScaffoldPath,
      outputLayoutName.replace(/\.js/, ''),
      outputLayoutName
    )
    const template = generateTemplate(
      path.join('scaffold', 'templates', 'layouts', layout),
      {
        name,
        pascalScaffoldPath,
        pluralRouteName,
        newRouteName,
      }
    )
    fileList[outputPath] = template
  })

  return fileList
}

const pageFiles = (name, scaffoldPath = '') => {
  const pluralName = pascalcase(pluralize(name))
  const singularName = pascalcase(pluralize.singular(name))
  let fileList = {}

  const pascalScaffoldPath =
    scaffoldPath === ''
      ? scaffoldPath
      : scaffoldPath.split('/').map(pascalcase).join('/') + '/'

  PAGES.forEach((page) => {
    const outputPageName = page
      .replace(/Names/, pluralName)
      .replace(/Name/, singularName)
      .replace(/\.template/, '')
    const outputPath = path.join(
      getPaths().web.pages,
      pascalScaffoldPath,
      outputPageName.replace(/\.js/, ''),
      outputPageName
    )
    const template = generateTemplate(
      path.join('scaffold', 'templates', 'pages', page),
      {
        name,
        pascalScaffoldPath,
      }
    )
    fileList[outputPath] = template
  })

  return fileList
}

const componentFiles = async (name, scaffoldPath = '') => {
  const pluralName = pascalcase(pluralize(name))
  const singularName = pascalcase(pluralize.singular(name))
  const model = await getSchema(singularName)
  const idType = getIdType(model)
  const columns = model.fields.filter((field) => field.kind !== 'object')
  const intForeignKeys = intForeignKeysForModel(model)
  let fileList = {}
  const editableColumns = columns
    .filter((column) => {
      return NON_EDITABLE_COLUMNS.indexOf(column.name) === -1
    })
    .map((column) => ({
      ...column,
      label: humanize(column.name),
    }))

  const pascalScaffoldPath =
    scaffoldPath === ''
      ? scaffoldPath
      : scaffoldPath.split('/').map(pascalcase).join('/') + '/'

  const pluralCamelName = camelcase(pluralName)
  const camelScaffoldPath = camelcase(pascalcase(scaffoldPath))

  const pluralRouteName =
    scaffoldPath === '' ? pluralCamelName : `${camelScaffoldPath}${pluralName}`

  const editRouteName =
    scaffoldPath === ''
      ? `edit${singularName}`
      : `${camelScaffoldPath}Edit${singularName}`

  const singularRouteName =
    scaffoldPath === ''
      ? camelcase(singularName)
      : `${camelScaffoldPath}${singularName}`

  const newRouteName =
    scaffoldPath === ''
      ? `new${singularName}`
      : `${camelScaffoldPath}New${singularName}`

  await asyncForEach(COMPONENTS, (component) => {
    const outputComponentName = component
      .replace(/Names/, pluralName)
      .replace(/Name/, singularName)
      .replace(/\.template/, '')
    const outputPath = path.join(
      getPaths().web.components,
      pascalScaffoldPath,
      outputComponentName.replace(/\.js/, ''),
      outputComponentName
    )

    const template = generateTemplate(
      path.join('scaffold', 'templates', 'components', component),
      {
        name,
        columns,
        editableColumns,
        idType,
        intForeignKeys,
        pascalScaffoldPath,
        pluralRouteName,
        editRouteName,
        singularRouteName,
        newRouteName,
      }
    )
    fileList[outputPath] = template
  })

  return fileList
}

// add routes for all pages
export const routes = async ({ model: name, path: scaffoldPath = '' }) => {
  const singularPascalName = pascalcase(pluralize.singular(name))
  const pluralPascalName = pascalcase(pluralize(name))
  const singularCamelName = camelcase(singularPascalName)
  const pluralCamelName = camelcase(pluralPascalName)
  const pluralParamName = paramCase(pluralPascalName)
  const model = await getSchema(singularPascalName)
  const idRouteParam = getIdType(model) === 'Int' ? ':Int' : ''

  const paramScaffoldPath =
    scaffoldPath === ''
      ? scaffoldPath
      : scaffoldPath.split('/').map(paramCase).join('/') + '/'
  const pascalScaffoldPath = pascalcase(scaffoldPath)
  const camelScaffoldPath = camelcase(pascalScaffoldPath)

  const newRouteName =
    scaffoldPath === ''
      ? `new${singularPascalName}`
      : `${camelScaffoldPath}New${singularPascalName}`

  const editRouteName =
    scaffoldPath === ''
      ? `edit${singularPascalName}`
      : `${camelScaffoldPath}Edit${singularPascalName}`

  const singularRouteName =
    scaffoldPath === ''
      ? singularCamelName
      : `${camelScaffoldPath}${singularPascalName}`

  const pluralRouteName =
    scaffoldPath === ''
      ? pluralCamelName
      : `${camelScaffoldPath}${pluralPascalName}`

  // TODO: These names look like they need changing

  return [
    // new
    `<Route path="/${paramScaffoldPath}${pluralParamName}/new" page={${pascalScaffoldPath}New${singularPascalName}Page} name="${newRouteName}" />`,
    // edit
    `<Route path="/${paramScaffoldPath}${pluralParamName}/{id${idRouteParam}}/edit" page={${pascalScaffoldPath}Edit${singularPascalName}Page} name="${editRouteName}" />`,
    // singular
    `<Route path="/${paramScaffoldPath}${pluralParamName}/{id${idRouteParam}}" page={${pascalScaffoldPath}${singularPascalName}Page} name="${singularRouteName}" />`,
    // plural
    `<Route path="/${paramScaffoldPath}${pluralParamName}" page={${pascalScaffoldPath}${pluralPascalName}Page} name="${pluralRouteName}" />`,
  ]
}

const addScaffoldImport = () => {
  const indexJsPath = path.join(getPaths().web.src, 'index.js')
  let indexJsContents = readFile(indexJsPath).toString()

  if (indexJsContents.match(SCAFFOLD_STYLE_PATH)) {
    return 'Skipping scaffold style include'
  }

  indexJsContents = indexJsContents.replace(
    "import Routes from 'src/Routes'\n",
    `import Routes from 'src/Routes'\n\nimport '${SCAFFOLD_STYLE_PATH}'`
  )
  writeFile(indexJsPath, indexJsContents, { overwriteExisting: true })

  return 'Added scaffold import to index.js'
}

export const command = 'scaffold <pathSlashModel>'
export const desc = 'Generate pages, SDL, and a services object.'
export const builder = {
  force: { type: 'boolean', default: false },
  // So the user can specify a path to nest the generated files under.
  // E.g. yarn rw g scaffold post --path=admin
  path: { type: 'string', default: false },
}
// The user can also specify a path in the argument.
// E.g. yarn rw g scaffold admin/post
export const handler = async ({ pathSlashModel, force, path: pathFlag }) => {
  let path
  // If path is specified by both pathSlashModel and pathFlag,
  // we give pathFlag precedence.
  pathFlag
    ? (path = pathFlag)
    : (path = pathSlashModel.split('/').slice(0, -1).join('/'))

  // This code will work whether or not there's a path in pathSlashModel
  // E.g. if pathSlashModel is just 'post',
  // path.split('/') will return ['post'].
  const model = pathSlashModel.split('/').pop()

  const tasks = new Listr(
    [
      {
        title: 'Generating scaffold files...',
        task: async () => {
          const f = await files({ model, path })
          return writeFilesTask(f, { overwriteExisting: force })
        },
      },
      {
        title: 'Adding scaffold routes...',
        task: async () => {
          return addRoutesToRouterTask(await routes({ model, path }))
        },
      },
      {
        title: 'Adding scaffold asset imports...',
        task: () => addScaffoldImport(),
      },
    ],
    { collapse: false, exitOnError: true }
  )
  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
