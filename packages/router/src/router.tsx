// The guts of the router implementation.
import * as React from 'react'

import {
  Location,
  parseSearch,
  replaceParams,
  matchPath,
  ParamsContext,
  navigate,
  mapNamedRoutes,
  SplashPage,
} from './internal'

const Route = () => {
  return null
}

const PrivateRoute = (props) => {
  return <Route private {...props} />
}

const PrivatePageLoader = ({ useAuth, onUnauthorized, children }) => {
  const { loading, authenticated } = useAuth()

  if (loading) {
    return null
  }

  if (authenticated) {
    return children
  } else {
    // By default this would redirect the user to the Route that is marked as `unauthorized`.
    onUnauthorized()
    return null
  }
}

const Router = (props) => (
  <Location>
    {(locationContext) => (
      <RouterImplementation {...locationContext} {...props} />
    )}
  </Location>
)

/**
 * Pages can be imported automatically or manually. Automatic imports are actually
 * objects and take the following form (which we call a 'spec'):
 *
 *   const WhateverPage = {
 *     name: 'WhateverPage',
 *     loader: () => import('src/pages/WhateverPage')
 *   }
 *
 * Manual imports simply load the page:
 *
 *   import WhateverPage from 'src/pages/WhateverPage'
 *
 * Before passing a "page" to the PageLoader, we will normalize the manually
 * imported version into a spec. */

export interface PageLoader {
  name: string
  loader?: () => Promise<any>
}

const normalizePage: (
  specOrPage: PageLoader | React.ReactElement
) => PageLoader = (specOrPage) => {
  if (specOrPage.loader) {
    // Already a spec, just return it.
    return specOrPage
  } else {
    // Wrap the Page in a fresh spec, and put it in a promise to emulate
    // an async module import.
    return {
      name: specOrPage.name,
      loader: async () => ({ default: specOrPage }),
    }
  }
}

const DEFAULT_PAGE_LOADING_DELAY = 1000 // milliseconds

export interface RouterImplementationProps {
  pathname: string
  search?: string
  paramTypes?: string
  pageLoadingDelay?: number
  children: React.ReactNode[]
}

export interface RouteProps {
  path: string
  name: string
  notfound?: boolean
  redirect?: string
  page: React.ReactElement
}

const RouterImplementation: React.FC<RouterImplementationProps> = ({
  pathname,
  search,
  paramTypes,
  pageLoadingDelay = DEFAULT_PAGE_LOADING_DELAY,
  children,
  useAuth = window.__REDWOOD__USE_AUTH,
  onUnauthorized,
}) => {
  // TODO
  const routes: React.ReactElement<RouteProps>[] = React.Children.toArray(
    children
  )
  mapNamedRoutes(routes)

  let unauthorizedRoutePath
  let NotFoundPage

  for (const route of routes) {
    const { path, page: Page, redirect, notfound, unauthorized } = route.props

    if (notfound) {
      NotFoundPage = Page
      continue
    }

    if (unauthorized) {
      unauthorizedRoutePath = path
    }

    const { match, params: pathParams } = matchPath(path, pathname, paramTypes)

    if (match) {
      const searchParams = parseSearch(search)
      const allParams = { ...pathParams, ...searchParams }

      if (redirect) {
        const newPath = replaceParams(redirect, pathParams)
        navigate(newPath)
        return (
          <RouterImplementation pathname={newPath} search={search}>
            {children}
          </RouterImplementation>
        )
      } else {
        const Loaders = () => {
          return (
            <ParamsContext.Provider value={allParams}>
              <PageLoader
                spec={normalizePage(Page)}
                delay={pageLoadingDelay}
                params={allParams}
              />
            </ParamsContext.Provider>
          )
        }

        if (route.type === PrivateRoute || route?.props?.private) {
          if (typeof useAuth === 'undefined') {
            throw new Error(
              "You're using a private route, but `useAuth` is undefined. Have you created an AuthProvider, or pased in the incorrect prop to `useAuth`?"
            )
          }
          return (
            <PrivatePageLoader
              useAuth={useAuth}
              onUnauthorized={
                // Run the custom function (passed to the router),
                // or fallback to the default which is to redirect the user to the
                // page that's marked `unauthorized`
                // TODO: Pass in the origin pathname.
                onUnauthorized
                  ? onUnauthorized
                  : () => {
                      // The developer must implement an unauthorized route.
                      navigate(unauthorizedRoutePath)
                    }
              }
            >
              <Loaders />
            </PrivatePageLoader>
          )
        }

        return <Loaders />
      }
    }
  }

  // If the router is being used in a Redwood app and only the notfound page is
  // specified, show the Redwood splash page.
  if (routes.length === 1 && NotFoundPage) {
    const isRedwood = typeof __REDWOOD__ !== 'undefined'
    return <SplashPage isRedwood={isRedwood} />
  }

  return (
    <ParamsContext.Provider value={{}}>
      <PageLoader spec={normalizePage(NotFoundPage)} />
    </ParamsContext.Provider>
  )
}

export { Router, Route, PrivateRoute }
