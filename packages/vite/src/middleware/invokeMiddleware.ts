import { defaultAuthProviderState, type ServerAuthState } from '@redwoodjs/auth'
import type { RWRouteManifestItem } from '@redwoodjs/internal/dist/routes'

import { MiddlewareRequest } from './MiddlewareRequest.js'
import { MiddlewareResponse } from './MiddlewareResponse.js'

export type Middleware = (
  req: MiddlewareRequest,
  res?: MiddlewareResponse,
  options?: MiddlewareInvokeOptions,
) => Promise<MiddlewareResponse> | MiddlewareResponse | void

export type MiddlewareInvokeOptions = {
  route?: RWRouteManifestItem
  cssPaths?: Array<string>
}

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
  options?: MiddlewareInvokeOptions,
): Promise<[MiddlewareResponse, ServerAuthState]> => {
  if (typeof middleware !== 'function') {
    return [MiddlewareResponse.next(), defaultAuthProviderState]
  }

  const mwReq = new MiddlewareRequest(req)
  let mwRes: MiddlewareResponse = MiddlewareResponse.next()

  try {
    const output =
      (await middleware(mwReq, MiddlewareResponse.next(), options)) ||
      MiddlewareResponse.next()

    // Error out early, incase user returns something else from the middleware
    // returning nothing is still fine!
    if (output instanceof MiddlewareResponse) {
      mwRes = output
    } else {
      console.error('Return from middleware >> ', output)
      console.error('\n----\n')
      throw new Error(
        'Invalid return type from middleware. You must return a MiddlewareResponse or a Response object, or nothing at all',
      )
    }
  } catch (e) {
    console.error('Error executing middleware > \n')
    console.error('~'.repeat(80))
    console.error(e)
    console.error('~'.repeat(80))
  }

  return [mwRes, mwReq.serverAuthContext.get()]
}
