import { Request } from 'express'
import { ViteDevServer } from 'vite'

import { MetaHook, TagDescriptor } from '@redwoodjs/web'
import type { RouteHookEvent, RouteHookOutput } from '@redwoodjs/web'

interface RouteHooks {
  meta?: MetaHook
}

interface TriggerRouteHooksParam {
  routeHooks: RouteHooks
  req: Request
  parsedParams?: Record<string, any>
  previousOutput?: RouteHookOutput
}

export const triggerRouteHooks = async ({
  routeHooks,
  req,
  parsedParams = {},
  previousOutput,
}: TriggerRouteHooksParam) => {
  const event: RouteHookEvent = {
    params: parsedParams,
    headers: req.headers || {},
    query: req.query as any, // TODO (STREAMING) we should parse query parameters the same way as RW router
    // cookies: req.cookies || {}, // TODO (STREAMING) we probably need some sort of cookie parser
    // TODO (STREAMING) called app routeHook, but its just the previous output
    appRouteHook: previousOutput,
  }

  let meta: TagDescriptor[] = previousOutput?.meta || []

  try {
    const metaRouteHookOutput = (await routeHooks?.meta?.(event)) || []

    // Convert it to an array, if it's not already
    const currentMeta = Array.isArray(metaRouteHookOutput)
      ? metaRouteHookOutput
      : [metaRouteHookOutput]

    meta = [...meta, ...currentMeta]
  } catch (e: any) {
    throw new Error(`Error in meta hook: ${e.message}`)
  }

  return {
    meta,
  }
}

interface LoadAndRunRouteHooks {
  paths: Array<string | null | undefined> // will run in order of the array
  reqMeta: {
    req: Request
    parsedParams?: Record<string, any>
  }
  viteDevServer?: ViteDevServer
  previousOutput?: RouteHookOutput
}

const defaultRouteHookOutput = {
  meta: [],
}

export const loadAndRunRouteHooks = async ({
  paths = [],
  reqMeta,
  viteDevServer,
  previousOutput = defaultRouteHookOutput,
}: LoadAndRunRouteHooks): Promise<RouteHookOutput> => {
  // Step 1, load the route hooks
  const loadModule = async (path: string) => {
    return viteDevServer ? viteDevServer.ssrLoadModule(path) : import(path)
  }

  let currentRouteHooks: RouteHooks

  // Pull out the first path
  // Remember shift will mutate the array
  const routeHookPath = paths.shift()

  if (!routeHookPath) {
    return defaultRouteHookOutput
  } else {
    try {
      currentRouteHooks = await loadModule(routeHookPath)

      // Step 2, run the route hooks
      const rhOutput = await triggerRouteHooks({
        routeHooks: currentRouteHooks,
        req: reqMeta.req,
        parsedParams: reqMeta.parsedParams,
        previousOutput,
      })

      if (paths.length > 0) {
        // Step 3, recursively call this function
        return loadAndRunRouteHooks({
          paths,
          reqMeta,
          previousOutput: rhOutput,
          viteDevServer,
        })
      } else {
        return rhOutput
      }
    } catch (e) {
      console.error(`Error loading route hooks in ${routeHookPath}}`)
      throw new Error(e as any)
    }
  }
}
