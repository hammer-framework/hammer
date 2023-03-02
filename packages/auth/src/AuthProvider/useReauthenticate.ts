import { useCallback } from 'react'

import { AuthImplementation } from '../AuthImplementation'

import { AuthProviderState } from './AuthProviderState'
import { useCurrentUser } from './useCurrentUser'
import { useToken } from './useToken'

const notAuthenticatedState = {
  isAuthenticated: false,
  currentUser: null,
  userMetadata: null,
  loading: false,
  hasError: false,
} as const

export const useReauthenticate = <TUser>(
  authImplementation: AuthImplementation<TUser>,
  setAuthProviderState: React.Dispatch<
    React.SetStateAction<AuthProviderState<TUser>>
  >,
  getCurrentUser: ReturnType<typeof useCurrentUser>,
  skipFetchCurrentUser: boolean | undefined
) => {
  const getToken = useToken(authImplementation)

  return useCallback(async () => {
    try {
      const userMetadata = await authImplementation.getUserMetadata()

      if (!userMetadata) {
        let loading = false

        if (authImplementation.clientHasLoaded) {
          loading = !authImplementation.clientHasLoaded()
        }

        setAuthProviderState({
          ...notAuthenticatedState,
          loading,
          client: authImplementation.client,
        })
      } else {
        await getToken()

        const currentUser = skipFetchCurrentUser ? null : await getCurrentUser()

        setAuthProviderState((oldState) => ({
          ...oldState,
          userMetadata,
          currentUser,
          isAuthenticated: true,
          loading: false,
          client: authImplementation.client,
        }))
      }
    } catch (e: any) {
      setAuthProviderState({
        ...notAuthenticatedState,
        hasError: true,
        error: e as Error,
      })
    }
  }, [
    authImplementation,
    getToken,
    setAuthProviderState,
    skipFetchCurrentUser,
    getCurrentUser,
  ])
}
