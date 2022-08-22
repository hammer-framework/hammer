import fs from 'fs'
import path from 'path'

import * as addPlugin from '@graphql-codegen/add'
import { loadCodegenConfig } from '@graphql-codegen/cli'
import { codegen } from '@graphql-codegen/core'
import type {
  Types as CodegenTypes,
  CodegenPlugin,
} from '@graphql-codegen/plugin-helpers'
import * as typescriptPlugin from '@graphql-codegen/typescript'
import * as typescriptOperations from '@graphql-codegen/typescript-operations'
import * as typescriptResolvers from '@graphql-codegen/typescript-resolvers'
import { CodeFileLoader } from '@graphql-tools/code-file-loader'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { loadDocuments, loadSchemaSync } from '@graphql-tools/load'
import type { LoadTypedefsOptions } from '@graphql-tools/load'
import { DocumentNode } from 'graphql'

import { getPaths } from '../paths'
import { getTsConfigs } from '../project'

export const generateTypeDefGraphQLApi = async () => {
  const filename = path.join(getPaths().api.types, 'graphql.d.ts')
  const prismaModels = getPrismaModels()
  const prismaImports = Object.keys(prismaModels).map((key) => {
    return `${key} as Prisma${key}`
  })

  const extraPlugins: CombinedPluginConfig[] = [
    {
      name: 'add',
      options: {
        content: [
          'import { Prisma } from "@prisma/client"',
          "import { MergePrismaWithSdlTypes, MakeRelationsOptional } from '@redwoodjs/api'",
          `import { ${prismaImports.join(', ')}} from '@prisma/client'`,
          `type MaybeOrArrayOfMaybe<T> = T | Maybe<T> | Maybe<T>[];`,
        ],
        placement: 'prepend',
      },
      codegenPlugin: addPlugin,
    },
    {
      name: 'print-mapped-moddels',
      options: {},
      codegenPlugin: printMappedModelsPlugin,
    },
    {
      name: 'typescript-resolvers',
      options: {},
      codegenPlugin: typescriptResolvers,
    },
  ]

  try {
    return await runCodegenGraphQL([], extraPlugins, filename)
  } catch (e) {
    console.error()
    console.error('Error: Could not generate GraphQL type definitions (api)')
    console.error(e)
    console.error()

    return []
  }
}

export const generateTypeDefGraphQLWeb = async () => {
  const filename = path.join(getPaths().web.types, 'graphql.d.ts')
  const options = getLoadDocumentsOptions(filename)
  const documentsGlob = './web/src/**/!(*.d).{ts,tsx,js,jsx}'

  let documents

  try {
    documents = await loadDocuments([documentsGlob], options)
  } catch {
    // No GraphQL documents present, no need to try to run codegen
    return []
  }

  const extraPlugins: CombinedPluginConfig[] = [
    {
      name: 'add',
      options: {
        content: 'import { Prisma } from "@prisma/client"',
        placement: 'prepend',
      },
      codegenPlugin: addPlugin,
    },
    {
      name: 'typescript-operations',
      options: {},
      codegenPlugin: typescriptOperations,
    },
  ]

  try {
    return await runCodegenGraphQL(documents, extraPlugins, filename)
  } catch (e) {
    console.error()
    console.error('Error: Could not generate GraphQL type definitions (web)')
    console.error(e)
    console.error()

    return []
  }
}

/**
 * This is the function used internally by generateTypeDefGraphQLApi and generateTypeDefGraphQLWeb
 * And contains the base configuration for generating gql types with codegen
 *
 * Named a little differently to make it easier to spot
 */
async function runCodegenGraphQL(
  documents: CodegenTypes.DocumentFile[],
  extraPlugins: CombinedPluginConfig[],
  filename: string
) {
  const userCodegenConfig = await loadCodegenConfig({
    configFilePath: getPaths().base,
  })

  // Merge in user codegen config with the rw built-in one
  const mergedConfig = {
    ...getPluginConfig(),
    ...userCodegenConfig?.config?.config,
  }

  const options = getCodegenOptions(documents, mergedConfig, extraPlugins)
  const output = await codegen(options)

  fs.mkdirSync(path.dirname(filename), { recursive: true })
  fs.writeFileSync(filename, output)

  return [filename]
}

function getLoadDocumentsOptions(filename: string) {
  const loadTypedefsConfig: LoadTypedefsOptions<{ cwd: string }> = {
    cwd: getPaths().base,
    ignore: [path.join(process.cwd(), filename)],
    loaders: [new CodeFileLoader()],
    sort: true,
  }

  return loadTypedefsConfig
}

function getPrismaModels() {
  let prismaModels: Record<string, string> = {}

  // Extract the models from the prisma client and use those to
  // set up internal redirects for the return values in resolvers.
  const localPrisma = require('@prisma/client')
  prismaModels = localPrisma.ModelName

  // This isn't really something you'd put in the GraphQL API, so
  // we can skip the model.
  if (prismaModels.RW_DataMigration) {
    delete prismaModels.RW_DataMigration
  }

  return prismaModels
}

function getPluginConfig() {
  const prismaModels: Record<string, string> = getPrismaModels()
  try {
    Object.keys(prismaModels).forEach((key) => {
      // Post = `@prisma/client#Post as PrismaPost`
      prismaModels[
        key
      ] = `MergePrismaWithSdlTypes<Prisma${key}, MakeRelationsOptional<${key}, AllMappedModels>, AllMappedModels>`
    })
  } catch (error) {
    // This means they've not set up prisma types yet
  }

  const pluginConfig: CodegenTypes.PluginConfig &
    typescriptResolvers.TypeScriptResolversPluginConfig = {
    makeResolverTypeCallable: true,
    namingConvention: 'keep', // to allow camelCased query names
    scalars: {
      // We need these, otherwise these scalars are mapped to any
      BigInt: 'number',
      DateTime: 'Date | string', // @Note: because DateTime fields can be valid Date-strings too
      Date: 'Date | string',
      JSON: 'Prisma.JsonValue',
      JSONObject: 'Prisma.JsonObject',
      Time: 'Date | string',
    },
    // prevent type names being PetQueryQuery, RW generators already append
    // Query/Mutation/etc
    omitOperationSuffix: true,
    showUnusedMappers: false,
    customResolverFn: getResolverFnType(),
    mappers: prismaModels,
    avoidOptionals: {
      resolvers: true,
    },
    contextType: `@redwoodjs/graphql-server/dist/functions/types#RedwoodGraphQLContext`,
  }

  return pluginConfig
}

export const getResolverFnType = () => {
  const tsConfig = getTsConfigs()

  if (tsConfig.api?.compilerOptions?.strict) {
    // In strict mode, bring a world of pain to the tests
    return `(
      args: TArgs,
      obj?: { root: TParent; context: TContext; info: GraphQLResolveInfo }
    ) => TResult | Promise<TResult>`
  } else {
    return `(
      args?: TArgs,
      obj?: { root: TParent; context: TContext; info: GraphQLResolveInfo }
    ) => TResult | Promise<TResult>`
  }
}

interface CombinedPluginConfig {
  name: string
  options: CodegenTypes.PluginConfig
  codegenPlugin: CodegenPlugin
}

/**
 *
 * Codgen plugin just lists all the SDL models that are also mapped Prisma models
 * We use a plugin, because its possible to have Prisma models that do not have an SDL model
 * so we can't just list all the Prisma models, even if they're included in the mappers object.
 *
 * Example:
 * type AllMappedModels = MaybeOrArrayOfMaybe<Post | User>
 *
 * Note that the types are SDL types, not Prisma types.
 * We do not include SDL-only types in this list.
 */
const printMappedModelsPlugin: CodegenPlugin = {
  plugin: (schema, _documents, config) => {
    Object.values(schema.getTypeMap()).filter((type) => {
      return (
        type.astNode?.kind === 'ObjectTypeDefinition' &&
        type.astNode.name.value === 'Query'
      )
    })

    // this way we can make sure relation types are not required
    const sdlTypesWhichAreMapped = Object.values(schema.getTypeMap())
      .filter((type) => {
        return type.astNode?.kind === 'ObjectTypeDefinition'
      })
      .filter((objectDefType) => {
        const modelName = objectDefType.astNode?.name.value
        return (
          modelName && modelName in config.mappers // Only keep the mapped Prisma models
        )
      })

    return `type MaybeOrArrayOfMaybe<T> = T | Maybe<T> | Maybe<T>[];\ntype AllMappedModels = MaybeOrArrayOfMaybe<${sdlTypesWhichAreMapped.join(
      ' | '
    )}>`
  },
}

function getCodegenOptions(
  documents: CodegenTypes.DocumentFile[],
  config: CodegenTypes.PluginConfig,
  extraPlugins: CombinedPluginConfig[]
) {
  const plugins = [
    { typescript: { enumsAsTypes: true } },
    ...extraPlugins.map((plugin) => ({ [plugin.name]: plugin.options })),
  ]

  const pluginMap = {
    typescript: typescriptPlugin,
    ...extraPlugins.reduce(
      (acc, cur) => ({ ...acc, [cur.name]: cur.codegenPlugin }),
      {}
    ),
  }

  const options: CodegenTypes.GenerateOptions = {
    // The typescript plugin returns a string instead of writing to a file, so
    // `filename` is not used
    filename: '',
    // `schemaAst` is used instead of `schema` if `schemaAst` is defined, and
    // `schema` isn't. In the source for GenerateOptions they have this
    // comment:
    //   Remove schemaAst and change schema to GraphQLSchema in the next major
    //   version
    // When that happens we'll have have to remove our `schema` line, and
    // rename `schemaAst` to `schema`
    schema: undefined as unknown as DocumentNode,
    schemaAst: loadSchemaSync(getPaths().generated.schema, {
      loaders: [new GraphQLFileLoader()],
      sort: true,
    }),
    documents,
    config,
    plugins,
    pluginMap,
    pluginContext: {},
  }

  return options
}
