/* eslint-disable react-hooks/rules-of-hooks */
import { useDepthLimit } from '@envelop/depth-limit'
import { useDisableIntrospection } from '@envelop/disable-introspection'
import { useFilterAllowedOperations } from '@envelop/filter-operation-type'
import type { PluginOrDisabledPlugin } from '@graphql-yoga/node'
import {
  EnvelopError,
  FormatErrorHandler,
  GraphQLYogaError,
} from '@graphql-yoga/node'
import { createServer } from '@graphql-yoga/node'
import type {
  APIGatewayProxyCallback,
  APIGatewayProxyEvent,
  Context as LambdaContext,
} from 'aws-lambda'
import { GraphQLError, GraphQLSchema, OperationTypeNode } from 'graphql'

import { RedwoodError } from '@redwoodjs/api'

import { mapRwCorsOptionsToYoga } from '../cors'
import { makeDirectivesForPlugin } from '../directives/makeDirectives'
import { ValidationError } from '../errors'
import { getAsyncStoreInstance } from '../globalContext'
import { makeMergedSchema } from '../makeMergedSchema/makeMergedSchema'
import { useRedwoodAuthContext } from '../plugins/useRedwoodAuthContext'
import type { useRedwoodDirectiveReturn } from '../plugins/useRedwoodDirective'
import {
  DirectivePluginOptions,
  useRedwoodDirective,
} from '../plugins/useRedwoodDirective'
import { useRedwoodGlobalContextSetter } from '../plugins/useRedwoodGlobalContextSetter'
import { useRedwoodLogger } from '../plugins/useRedwoodLogger'
import { useRedwoodPopulateContext } from '../plugins/useRedwoodPopulateContext'
import { configure } from '@vendia/serverless-express'

import type { GraphQLHandlerOptions } from './types'

/*
 * Prevent unexpected error messages from leaking to the GraphQL clients.
 *
 * Unexpected errors are those that are not Envelop, GraphQL, or Redwood errors
 **/
export const formatError: FormatErrorHandler = (err: any, message: string) => {
  const allowErrors = [GraphQLYogaError, EnvelopError, RedwoodError]

  // If using graphql-scalars, when validating input
  // the original TypeError is wrapped in an GraphQLError object.
  // We extract out and present the portion of the original error's
  // validation message that is friendly to send to the end user
  // @see https://github.com/Urigo/graphql-scalars and their validate method
  if (err && err instanceof GraphQLError) {
    if (err.originalError && err.originalError instanceof TypeError) {
      return new ValidationError(err.originalError.message)
    }
  }

  if (
    err.originalError &&
    !allowErrors.find(
      (allowedError) => err.originalError instanceof allowedError
    )
  ) {
    return new GraphQLError(message)
  }

  return err
}

/**
 * Creates an Enveloped GraphQL Server, configured with default Redwood plugins
 *
 * You can add your own plugins by passing them to the extraPlugins object
 *
 * @see https://www.envelop.dev/ for information about envelop
 * @see https://www.envelop.dev/plugins for available envelop plugins
 * ```js
 * export const handler = createGraphQLHandler({ schema, context, getCurrentUser })
 * ```
 */
export const createGraphQLHandler = ({
  healthCheckId,
  loggerConfig,
  context,
  getCurrentUser,
  onException,
  generateGraphiQLHeader,
  extraPlugins,
  cors,
  services,
  sdls,
  directives = [],
  depthLimitOptions,
  allowedOperations,
  defaultError = 'Something went wrong.',
  graphiQLEndpoint = '/graphql',
  schemaOptions,
}: GraphQLHandlerOptions) => {
  let schema: GraphQLSchema
  let redwoodDirectivePlugins = [] as PluginOrDisabledPlugin[]
  const logger = loggerConfig.logger

  try {
    // @NOTE: Directives are optional
    const projectDirectives = makeDirectivesForPlugin(directives)

    if (projectDirectives.length > 0) {
      ;(redwoodDirectivePlugins as useRedwoodDirectiveReturn[]) =
        projectDirectives.map((directive) =>
          useRedwoodDirective(directive as DirectivePluginOptions)
        )
    }

    schema = makeMergedSchema({
      sdls,
      services,
      directives: projectDirectives,
      schemaOptions,
    })
  } catch (e) {
    logger.fatal(e as Error, '\n ⚠️ GraphQL server crashed \n')

    // Forcefully crash the graphql server
    // so users know that a misconfiguration has happened
    process.exit(1)
  }

  // Important: Plugins are executed in order of their usage, and inject functionality serially,
  // so the order here matters
  const isDevEnv = process.env.NODE_ENV === 'development'

  const plugins: Array<PluginOrDisabledPlugin> = []

  if (!isDevEnv) {
    plugins.push(useDisableIntrospection())
  }

  // Custom Redwood plugins
  plugins.push(useRedwoodAuthContext(getCurrentUser))
  plugins.push(useRedwoodGlobalContextSetter())

  if (context) {
    plugins.push(useRedwoodPopulateContext(context))
  }

  // Custom Redwood plugins
  plugins.push(...redwoodDirectivePlugins)

  // Limits the depth of your GraphQL selection sets.
  plugins.push(
    useDepthLimit({
      maxDepth: (depthLimitOptions && depthLimitOptions.maxDepth) || 10,
      ignore: (depthLimitOptions && depthLimitOptions.ignore) || [],
    })
  )
  // Only allow execution of specific operation types
  plugins.push(
    useFilterAllowedOperations(
      allowedOperations || [OperationTypeNode.QUERY, OperationTypeNode.MUTATION]
    )
  )

  // App-defined plugins
  if (extraPlugins && extraPlugins.length > 0) {
    plugins.push(...extraPlugins)
  }

  // Must be "last" in plugin chain, but before error masking
  // so can process any data added to results and extensions
  plugins.push(useRedwoodLogger(loggerConfig))

  const yoga = createServer({
    id: healthCheckId,
    schema,
    plugins,
    maskedErrors: {
      formatError,
      errorMessage: defaultError,
    },
    logging: logger,
    graphiql: isDevEnv
      ? {
          title: 'Redwood GraphQL Playground',
          endpoint: graphiQLEndpoint,
          headers: generateGraphiQLHeader
            ? generateGraphiQLHeader()
            : `{"x-auth-comment": "See documentation: https://redwoodjs.com/docs/cli-commands#setup-graphiQL-headers on how to auto generate auth headers"}`,
          defaultQuery: `query Redwood {
  redwood {
    version
  }
}`,
          headerEditorEnabled: true,
        }
      : false,
    cors: (request: Request) => {
      const requestOrigin = request.headers.get('origin')
      return mapRwCorsOptionsToYoga(cors, requestOrigin)
    },
  })

  const handlerFn = configure({
    app: yoga,
    log: logger,
  })

  return (
    event: APIGatewayProxyEvent,
    context: LambdaContext,
    callback: APIGatewayProxyCallback
  ): Promise<any> => {
    const execFn = async () => {
      try {
        return await handlerFn(event, context, callback)
      } catch (e) {
        onException && onException()

        throw e
      }
    }

    if (getAsyncStoreInstance()) {
      // This must be used when you're self-hosting RedwoodJS.
      return getAsyncStoreInstance().run(new Map(), execFn)
    } else {
      // This is OK for AWS (Netlify/Vercel) because each Lambda request
      // is handled individually.
      return execFn()
    }
  }
}
