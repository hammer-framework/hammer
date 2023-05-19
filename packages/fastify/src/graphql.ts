import type { FastifyInstance, HookHandlerDoneFunction } from 'fastify'

import type { GraphQLYogaOptions } from '@redwoodjs/graphql-server'
import { createGraphQLYoga } from '@redwoodjs/graphql-server'
/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
export async function redwoodFastifyGraphQLServer(
  fastify: FastifyInstance,
  options: GraphQLYogaOptions,
  done: HookHandlerDoneFunction
) {
  try {
    const { yoga } = createGraphQLYoga(options)

    fastify.route({
      url: yoga.graphqlEndpoint,
      method: ['GET', 'POST', 'OPTIONS'],
      handler: async (req, reply) => {
        const response = await yoga.handleNodeRequest(req, {
          req,
          reply,
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
