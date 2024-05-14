import {
  middlewareDefaultAuthProviderState,
  type ServerAuthState,
} from '@redwoodjs/auth'

import { initWorkerServerStore_MSG } from '../rsc/rscWorkerCommunication.js'
import { initServerStore, setServerAuthState } from '../serverStore.js'

import { MiddlewareRequest } from './MiddlewareRequest.js'
import { MiddlewareResponse } from './MiddlewareResponse.js'
import type { Middleware, MiddlewareInvokeOptions } from './types.js'

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
    setupServerStore(req, middlewareDefaultAuthProviderState)

    return [MiddlewareResponse.next(), middlewareDefaultAuthProviderState]
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
        'Invalid return type from middleware. You must return a MiddlewareResponse or nothing at all',
      )
    }
  } catch (e) {
    console.error('Error executing middleware > \n')
    console.error('~'.repeat(80))
    console.error(e)
    console.error('~'.repeat(80))
  } finally {
    // This one is for the server. We may want to move this up as a app.use middleware
    // if we use the `.run` method from AsyncLocalStorage.
    setupServerStore(req, mwReq.serverAuthContext.get())
  }

  return [mwRes, mwReq.serverAuthContext.get()]
}

const setupServerStore = (req: Request, serverAuthState: ServerAuthState) => {
  initServerStore(req)

  // Set the auth state in serverStore + send message to worker to also update its state
  setServerAuthState(serverAuthState)

  // Send a message to the worker to init its server store
  // REMEMBER: This will only be called in DEV (eventually!)
  initWorkerServerStore_MSG({
    headersInit: Object.fromEntries(req.headers.entries()),
    serverAuthContext: serverAuthState,
  })
}
