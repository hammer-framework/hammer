import { defaultAuthProviderState, type ServerAuthState } from '@redwoodjs/auth'

import { MiddlewareRequest } from './MiddlewareRequest.js'
import { MiddlewareResponse } from './MiddlewareResponse.js'

type Middleware = (
  req: MiddlewareRequest,
  res?: MiddlewareResponse,
) => Promise<MiddlewareResponse> | Response | void

/**
 *
 * Invokes the middleware function, and guarantees and MWResponse object is returned
 * (also making sure that the eventual Response will be of PonyResponse)
 *
 * Returns Tuple<MiddlewareResponse, ServerAuthState>
 *
 */
export const invoke = async (
  req: Request,
  middleware?: Middleware,
): Promise<[MiddlewareResponse, ServerAuthState]> => {
  if (typeof middleware !== 'function') {
    return [MiddlewareResponse.next(), defaultAuthProviderState]
  }

  const mwReq = new MiddlewareRequest(req)
  let mwRes: MiddlewareResponse = MiddlewareResponse.next()

  try {
    const output = (await middleware(mwReq)) || MiddlewareResponse.next()

    if (output instanceof MiddlewareResponse) {
      mwRes = output
    } else {
      // If it was a WebAPI Response
      mwRes = MiddlewareResponse.fromResponse(output)
    }
  } catch (e) {
    console.error('Error executing middleware > \n')
    console.error('~'.repeat(80))
    console.error(e)
    console.error('~'.repeat(80))
  }

  return [mwRes, mwReq.serverAuthContext.get()]
}
