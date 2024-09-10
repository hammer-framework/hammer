import { use, useState, useEffect } from 'react'

import type { Options } from 'react-server-dom-webpack/client'
import { createFromFetch, encodeReply } from 'react-server-dom-webpack/client'

import { RscCache } from './RscCache.js'
import type { RscModel } from './RscCache.js'

const BASE_PATH = '/rw-rsc/'

const rscCache = new RscCache()

export interface RscProps extends Record<string, unknown> {
  location: {
    pathname: string
    search: string
  }
}

let updateCurrentRscCacheKey = (key: string) => {
  console.error('updateCurrentRscCacheKey called before it was set')
  console.error('updateCurrentRscCacheKey key', key)
}

function onStreamFinished(
  fetchPromise: ReturnType<typeof fetch>,
  onFinished: (text: string) => void,
) {
  return (
    fetchPromise
      // clone the response so createFromFetch can use it (otherwise we lock the
      // reader) and wait for the text to be consumed so we know the stream is
      // finished
      .then((response) => response.clone().text())
      .then(onFinished)
  )
}

function rscFetchRoutes(serializedProps: string) {
  console.log(
    'rscFetchRoutes :: args:\n    serializedProps: ' + serializedProps,
  )
  const rscCacheKey = serializedProps

  const cached = rscCache.get(rscCacheKey)
  if (cached) {
    console.log('rscFetchRoutes :: cache hit for', rscCacheKey)
    return cached
  } else {
    console.log('rscFetchRoutes :: cache miss for', rscCacheKey)
  }

  const searchParams = new URLSearchParams()
  searchParams.set('props', serializedProps)

  const rscId = '__rwjs__Routes'

  // TODO (RSC): During SSR we should not fetch (Is this function really
  // called during SSR?)
  const responsePromise = fetch(BASE_PATH + rscId + '?' + searchParams, {
    headers: {
      'rw-rsc': '1',
    },
  })

  const options: Options<unknown[], RscModel> = {
    // React will hold on to `callServer` and use that when it detects a
    // server action is invoked (like `action={onSubmit}` in a <form>
    // element). So for now at least we need to send it with every RSC
    // request, so React knows what `callServer` method to use for server
    // actions inside the RSC.
    // TODO (RSC): Need to figure out the types for callServer
    // @ts-expect-error types
    callServer: async function (rsaId: string, args: unknown[]) {
      // `args` is often going to be an array with just a single element,
      // and that element will be FormData
      console.log('RscRoutes :: callServer rsaId', rsaId, 'args', args)

      // Including rsaId here for debugging reasons only, what's important is
      // `new Date()`, to make sure the cache key is unique so we trigger a
      // rerender. It's needed to handle calling RSAs multiple times with the
      // same arguments
      const rscCacheKey = `${serializedProps}::${rsaId}::${new Date()}`

      const searchParams = new URLSearchParams()
      searchParams.set('action_id', rsaId)
      searchParams.set('props', serializedProps)
      const rscId = '_'

      let body: Awaited<ReturnType<typeof encodeReply>> = ''

      try {
        body = await encodeReply(args)
      } catch (e) {
        console.error('Error encoding Server Action arguments', e)
      }

      const responsePromise = fetch(BASE_PATH + rscId + '?' + searchParams, {
        method: 'POST',
        body,
        headers: {
          'rw-rsc': '1',
        },
      })

      onStreamFinished(responsePromise, () => {
        updateCurrentRscCacheKey(rscCacheKey)
      })

      // I'm not sure this recursive use of `options` is needed. I briefly
      // tried without it, and things seemed to work. But keeping it for
      // now, until we learn more.
      const modelPromise = createFromFetch(responsePromise, options)

      rscCache.set(rscCacheKey, modelPromise)

      const model = await modelPromise

      return model.__rwjs__rsa_data
    },
  }

  const modelPromise = createFromFetch<never, RscModel>(
    responsePromise,
    options,
  )

  rscCache.set(rscCacheKey, modelPromise)

  // TODO (RSC): Figure out if this is ever used, or if it's better to return
  // the cache key
  return modelPromise
}

interface Props {
  routesProps: RscProps
}

// TODO (RSC): This only works as long as we only have one RscRoutes component.
// We should look at having this be a (Weak?) Map or maybe just a `useRef` thing
// It needs to be a stable promise. Can't re-create it on every render
let externalPromiseResolver = (_component: React.ReactElement) => {}
let externalPromise = new Promise<React.ReactElement>((resolve) => {
  externalPromiseResolver = resolve
})

export const RscRoutes = ({ routesProps }: Props) => {
  const serializedProps = JSON.stringify(routesProps)
  const [currentRscCacheKey, setCurrentRscCacheKey] = useState(() => {
    console.log('RscRoutes :: useState initial value')
    // Calling rscFetchRoutes here to prime the cache
    rscFetchRoutes(serializedProps)
    return serializedProps
  })

  useEffect(() => {
    console.log('RscRoutes :: useEffect set updateCurrentRscCacheKey')
    updateCurrentRscCacheKey = (key: string) => {
      console.log('RscRoutes inside updateCurrentRscCacheKey', key)

      externalPromise = new Promise<React.ReactElement>((resolve) => {
        externalPromiseResolver = resolve
      })
      setCurrentRscCacheKey(key)
    }
  }, [])

  useEffect(() => {
    console.log('RscRoutes :: useEffect about to call rscFetchRoutes')
    // rscFetchRoutes will update rscCache with the fetched component
    rscFetchRoutes(serializedProps)

    externalPromise = new Promise<React.ReactElement>((resolve) => {
      externalPromiseResolver = resolve
    })
    setCurrentRscCacheKey(serializedProps)
  }, [serializedProps])

  console.log('RscRoutes :: rendering cache entry for\n' + currentRscCacheKey)

  const rscModelPromise = rscCache.get(currentRscCacheKey)

  if (!rscModelPromise) {
    throw new Error('Missing RSC cache entry for ' + currentRscCacheKey)
  }

  rscModelPromise.then((resolvedModel) => {
    console.log('RscRoutes :: resolvedModel', resolvedModel)
    externalPromiseResolver(resolvedModel.__rwjs__Routes[0])
  })

  return use(externalPromise)
}
