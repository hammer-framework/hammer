import type { CurrentUser } from '@redwoodjs/auth'
import { createAuthentication } from '@redwoodjs/auth'

import { getCurrentUserFromMiddleware } from './getCurrentUserFromMiddleware'
import type { WebAuthnClientType } from './webAuthn'

export interface LoginAttributes {
  username: string
  password: string
}

export interface ResetPasswordAttributes {
  resetToken: string
  password: string
}

export type SignupAttributes = Record<string, unknown> & LoginAttributes

const TOKEN_CACHE_TIME = 5000

export function createMiddlewareAuth(
  dbAuthClient: ReturnType<typeof createDbAuthClient>,
  customProviderHooks?: {
    useCurrentUser: () => Promise<CurrentUser>
    useHasRole?: (
      currentUser: CurrentUser | null,
    ) => (rolesToCheck: string | string[]) => boolean
  },
) {
  return createAuthentication(dbAuthClient, {
    // @MARK This is key! 👇
    // Override the default getCurrentUser to fetch it from middleware instead
    ...customProviderHooks,
    useCurrentUser: customProviderHooks?.useCurrentUser
      ? customProviderHooks?.useCurrentUser
      : () => getCurrentUserFromMiddleware(dbAuthClient.getAuthUrl()),
  })
}

export function createAuth(
  dbAuthClient: ReturnType<typeof createDbAuthClient>,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<CurrentUser>
    useHasRole?: (
      currentUser: CurrentUser | null,
    ) => (rolesToCheck: string | string[]) => boolean
  },
) {
  return createAuthentication(dbAuthClient, customProviderHooks)
}

export interface DbAuthClientArgs {
  webAuthn?: InstanceType<WebAuthnClientType>
  dbAuthUrl?: string
  fetchConfig?: {
    credentials?: 'include' | 'same-origin'
  }
  middleware?: boolean
}

export function createDbAuthClient({
  webAuthn,
  dbAuthUrl,
  fetchConfig,
  middleware = false,
}: DbAuthClientArgs = {}) {
  const credentials = fetchConfig?.credentials || 'same-origin'
  webAuthn?.setAuthApiUrl(dbAuthUrl)

  let getTokenPromise: null | Promise<string | null>
  let lastTokenCheckAt = new Date('1970-01-01T00:00:00')
  let cachedToken: string | null

  const getDbAuthUrl = () => {
    if (dbAuthUrl) {
      return dbAuthUrl
    }

    return middleware ? `/middleware/dbauth` : `${RWJS_API_URL}/auth`
  }

  const resetAndFetch = async (...params: Parameters<typeof fetch>) => {
    resetTokenCache()
    return fetch(...params)
  }

  const isTokenCacheExpired = () => {
    const now = new Date()
    return now.getTime() - lastTokenCheckAt.getTime() > TOKEN_CACHE_TIME
  }

  const resetTokenCache = () => {
    lastTokenCheckAt = new Date('1970-01-01T00:00:00')
    cachedToken = null
  }

  const forgotPassword = async (username: string) => {
    const response = await resetAndFetch(getDbAuthUrl(), {
      credentials,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, method: 'forgotPassword' }),
    })

    return response.json()
  }

  const getToken = async () => {
    // Middleware auth providers doesn't need a token
    if (middleware) {
      return null
    }
    // Return the existing fetch promise, so that parallel calls
    // to getToken only cause a single fetch
    if (getTokenPromise) {
      return getTokenPromise
    }

    if (isTokenCacheExpired()) {
      getTokenPromise = fetch(`${getDbAuthUrl()}?method=getToken`, {
        credentials,
      })
        .then((response) => response.text())
        .then((tokenText) => {
          lastTokenCheckAt = new Date()
          cachedToken = tokenText.length === 0 ? null : tokenText
          return cachedToken
        })
        .catch(() => {
          return null
        })
        .finally(() => {
          getTokenPromise = null
        })

      return getTokenPromise
    }

    return cachedToken
  }

  const login = async ({ username, password }: LoginAttributes) => {
    const response = await resetAndFetch(getDbAuthUrl(), {
      credentials,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, method: 'login' }),
    })

    return response.json()
  }

  const logout = async () => {
    await resetAndFetch(getDbAuthUrl(), {
      credentials,
      method: 'POST',
      body: JSON.stringify({ method: 'logout' }),
    })

    return true
  }

  const resetPassword = async (attributes: ResetPasswordAttributes) => {
    const response = await resetAndFetch(getDbAuthUrl(), {
      credentials,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...attributes, method: 'resetPassword' }),
    })

    return response.json()
  }

  const signup = async (attributes: SignupAttributes) => {
    const response = await resetAndFetch(getDbAuthUrl(), {
      credentials,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...attributes, method: 'signup' }),
    })

    return response.json()
  }

  const validateResetToken = async (resetToken: string | null) => {
    const response = await resetAndFetch(getDbAuthUrl(), {
      credentials,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, method: 'validateResetToken' }),
    })

    return response.json()
  }

  /*
  Cookie+Middleware based auth providers cannot retrieve current user from localStorage, etc.
  It either has to retrieve it from serverAuthState (e.g. on first render)
  or has to retrieve it from the middleware, where the cookie gets validated first.

  getUserMetadata is used in reauthenticate. So when you login in, the currentUser get's fetched
  from the server, so that it will redirect
  */
  const getUserMetadata = async () => {
    return middleware
      ? getCurrentUserFromMiddleware(getDbAuthUrl())
      : getToken()
  }

  return {
    type: 'dbAuth',
    client: webAuthn,
    login,
    logout,
    signup,
    getToken,
    getUserMetadata,
    forgotPassword,
    resetPassword,
    validateResetToken,
    // 👇 New methods for middleware auth
    // so we can get the dbAuthUrl in getCurrentUserFromMiddleware
    getAuthUrl: getDbAuthUrl,
    // This is so that we can skip fetching getCurrentUser in reauthenticate
    useMiddlewareAuth: middleware,
  }
}
