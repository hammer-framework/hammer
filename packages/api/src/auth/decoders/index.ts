import type { GlobalContext } from 'src/globalContext'
import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'
import type { SupportedAuthTypes } from '@redwoodjs/auth'

import { netlify } from './netlify'
import { auth0 } from './auth0'
const noop = (token: string) => token

const typesToDecoders: Record<SupportedAuthTypes, Function> = {
  auth0: auth0,
  netlify: netlify,
  goTrue: netlify,
  magicLink: noop,
  firebase: noop,
  custom: noop,
}

export const decodeToken = async (
  type: SupportedAuthTypes,
  token: string,
  req: {
    event: APIGatewayProxyEvent
    context: GlobalContext & LambdaContext
  }
): Promise<null | string | object> => {
  if (!typesToDecoders[type]) {
    // Make this a warning, instead of a hard error
    // Allow users to have multiple custom types if they choose to
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `The auth type "${type}" is not officially supported, we currently support: ${Object.keys(
          typesToDecoders
        ).join(', ')}`
      )

      console.warn(
        'Please ensure you have handlers for your custom auth in getCurrentUser in src/lib/auth.{js,ts}'
      )
    }
  }
  const decoder = typesToDecoders[type] || noop
  return decoder(token, req)
}
