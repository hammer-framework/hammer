import fastifyUrlData from '@fastify/url-data'
import type { FastifyInstance, HookHandlerDoneFunction } from 'fastify'
import fastifyRawBody from 'fastify-raw-body'

import type {
  GraphQLYogaOptions,
  GlobalContext,
} from '@redwoodjs/graphql-server'
import {
  createGraphQLYoga,
  getAsyncStoreInstance,
} from '@redwoodjs/graphql-server'

/**
 * Transform a Fastify Request to an event compatible with the RedwoodGraphQLContext's event
 * which is based on the AWS Lambda event
 */
import { lambdaEventForFastifyRequest as transformToRedwoodGraphQLContextEvent } from './lambda/index'

/**
 * Redwood GraphQL Server Fastify plugin based on GraphQL Yoga
 *
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {GraphQLYogaOptions} options GraphQLYogaOptions options used to configure the GraphQL Yoga Server
 */
export async function redwoodFastifyGraphQLServer(
  fastify: FastifyInstance,
  options: GraphQLYogaOptions,
  done: HookHandlerDoneFunction
) {
  // These two plugins are needed to transform a Fastify Request to a Lambda event
  // which is used by the RedwoodGraphQLContext and mimics the behavior of the
  // api-server withFunction plugin
  fastify.register(fastifyUrlData)
  await fastify.register(fastifyRawBody)

  try {
    const { yoga } = createGraphQLYoga(options)

    // TODO: This should be refactored to only be defined once and it might not live here
    // Ensure that each request has a unique global context
    fastify.addHook('onRequest', (_req, _reply, done) => {
      getAsyncStoreInstance().run(new Map<string, GlobalContext>(), done)
    })

    fastify.route({
      url: yoga.graphqlEndpoint,
      method: ['GET', 'POST', 'OPTIONS'],
      handler: async (req, reply) => {
        const response = await yoga.handleNodeRequest(req, {
          req,
          reply,
          event: transformToRedwoodGraphQLContextEvent(req),
          requestContext: {},
        })

        for (const [name, value] of response.headers) {
          reply.header(name, value)
        }

        reply.status(response.status)
        reply.send(response.body)

        return reply
      },
    })

    fastify.ready(() => {
      console.log(`GraphQL Yoga Server endpoint at ${yoga.graphqlEndpoint}`)
    })

    done()
  } catch (e) {
    console.log(e)
  }
}
