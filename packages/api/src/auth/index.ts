export * from './parseJWT'

import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'
import { parse as parseCookie } from 'cookie'

import { getEventHeader } from '../event'

import type { Decoded } from './parseJWT'
export type { Decoded }

// This is shared by `@redwoodjs/web`
const AUTH_PROVIDER_HEADER = 'auth-provider'

export const getAuthProviderHeader = (
  event: APIGatewayProxyEvent | Request,
) => {
  const authProviderKey = Object.keys(event?.headers ?? {}).find(
    (key) => key.toLowerCase() === AUTH_PROVIDER_HEADER,
  )
  if (authProviderKey) {
    return getEventHeader(event, authProviderKey)
  }
  return undefined
}

export interface AuthorizationHeader {
  schema: 'Bearer' | 'Basic' | string
  token: string
}

export const parseAuthorizationCookie = (
  event: APIGatewayProxyEvent | Request,
) => {
  const cookie = getEventHeader(event, 'Cookie')

  // Unauthenticated request
  if (!cookie) {
    return null
  }

  const parsedCookie = parseCookie(cookie)

  return {
    parsedCookie,
    rawCookie: cookie,
    // When not unauthenticated, this will be null/undefined
    // Remember that the cookie header could contain other (unrelated) values!
    type: parsedCookie['auth-provider'],
  }
}

/**
 * Split the `Authorization` header into a schema and token part.
 */
export const parseAuthorizationHeader = (
  event: APIGatewayProxyEvent | Request,
): AuthorizationHeader => {
  const parts = getEventHeader(event, 'Authorization')?.split(' ')
  if (parts?.length !== 2) {
    throw new Error('The `Authorization` header is not valid.')
  }
  const [schema, token] = parts
  if (!schema.length || !token.length) {
    throw new Error('The `Authorization` header is not valid.')
  }
  return { schema, token }
}

/** @MARK Note that we do not send LambdaContext when making fetch requests
 *
 * This part is incomplete, as we need to decide how we will make the breaking change to
 * 1. getCurrentUser
 * 2. authDecoders

 */

export type AuthContextPayload = [
  Decoded,
  { type: string } & AuthorizationHeader,
  { event: APIGatewayProxyEvent | Request; context: LambdaContext },
]

export type Decoder = (
  token: string,
  type: string,
  req: { event: APIGatewayProxyEvent | Request; context: LambdaContext },
) => Promise<Decoded>

/**
 * Get the authorization information from the request headers and request context.
 * @returns [decoded, { type, schema, token }, { event, context }]
 **/
export const getAuthenticationContext = async ({
  authDecoder,
  event,
  context,
}: {
  authDecoder?: Decoder | Decoder[]
  event: APIGatewayProxyEvent | Request
  context: LambdaContext
}): Promise<undefined | AuthContextPayload> => {
  const cookieHeader = parseAuthorizationCookie(event)
  const typeFromHeader = getAuthProviderHeader(event)

  // Short-circuit - if no auth-provider or cookie header, its
  // an unauthenticated request
  if (!typeFromHeader && !cookieHeader) {
    return undefined
  }

  let token: string | undefined
  let type: string | undefined
  let schema: string | undefined

  // The actual session parsing is done by the auth decoder
  if (cookieHeader) {
    token = cookieHeader.rawCookie
    type = cookieHeader.type
    schema = 'cookie'
    // If type is set in the header, use Bearer token auth (priority 2)
  } else if (typeFromHeader) {
    const parsedAuthHeader = parseAuthorizationHeader(event as any)
    token = parsedAuthHeader.token
    type = typeFromHeader
    schema = parsedAuthHeader.schema
  }

  // Unauthenticated request
  if (!token || !type || !schema) {
    return undefined
  }

  // Run through decoders until one returns a decoded payload
  let authDecoders: Array<Decoder> = []

  if (Array.isArray(authDecoder)) {
    authDecoders = authDecoder
  } else if (authDecoder) {
    authDecoders = [authDecoder]
  }

  let decoded = null

  let i = 0
  while (!decoded && i < authDecoders.length) {
    decoded = await authDecoders[i](token, type, {
      // @MARK: When called from middleware, the decoder will pass Request, not Lambda event
      event,
      context,
    })
    i++
  }

  // @TODO should we rename token? It's not actually the token - its the cookie header -because
  // some auth providers will have a cookie where we don't know the key
  return [decoded, { type, schema, token }, { event, context }]
}
