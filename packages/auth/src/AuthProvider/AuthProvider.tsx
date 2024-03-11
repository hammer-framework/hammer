import type { ReactNode } from 'react'
import React, { useContext, useEffect, useState } from 'react'

import type { AuthContextInterface, CurrentUser } from '../AuthContext'
import type { AuthImplementation } from '../AuthImplementation'

import type { AuthProviderState } from './AuthProviderState'
import { defaultAuthProviderState } from './AuthProviderState'
import { ServerAuthContext } from './ServerAuthProvider'
import { useCurrentUser } from './useCurrentUser'
import { useForgotPassword } from './useForgotPassword'
import { useHasRole } from './useHasRole'
import { useLogIn } from './useLogIn'
import { useLogOut } from './useLogOut'
import { useReauthenticate } from './useReauthenticate'
import { useResetPassword } from './useResetPassword'
import { useSignUp } from './useSignUp'
import { useToken } from './useToken'
import { useValidateResetToken } from './useValidateResetToken'

export interface AuthProviderProps {
  skipFetchCurrentUser?: boolean
  children: ReactNode
}

export function createAuthProvider<
  TUser,
  TRestoreAuth,
  TLogInOptions,
  TLogIn,
  TLogOutOptions,
  TLogOut,
  TSignUpOptions,
  TSignUp,
  TForgotPassword,
  TResetPasswordOptions,
  TResetPassword,
  TValidateResetToken,
  TClient,
>(
  AuthContext: React.Context<
    | AuthContextInterface<
        TUser,
        TLogInOptions,
        TLogIn,
        TLogOutOptions,
        TLogOut,
        TSignUpOptions,
        TSignUp,
        TForgotPassword,
        TResetPasswordOptions,
        TResetPassword,
        TValidateResetToken,
        TClient
      >
    | undefined
  >,
  authImplementation: AuthImplementation<
    TUser,
    TRestoreAuth,
    TLogInOptions,
    TLogIn,
    TLogOutOptions,
    TLogOut,
    TSignUpOptions,
    TSignUp,
    TForgotPassword,
    TResetPasswordOptions,
    TResetPassword,
    TValidateResetToken,
    TClient
  >,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<CurrentUser>
    useHasRole?: (
      currentUser: CurrentUser | null,
    ) => (rolesToCheck: string | string[]) => boolean
  },
) {
  const AuthProvider = ({
    children,
    skipFetchCurrentUser,
  }: AuthProviderProps) => {
    // const [hasRestoredState, setHasRestoredState] = useState(false)

    const serverAuthState = useContext(ServerAuthContext)

    const [authProviderState, setAuthProviderState] = useState<
      AuthProviderState<TUser>
    >(serverAuthState || defaultAuthProviderState)

    const getToken = useToken(authImplementation)

    // We're disabling eslint here, because while yes, technically we are
    // conditionally calling a hook, which you're not allowed to do. But in
    // practice a customProviderHook is either always going to be supplied,
    // or never
    const getCurrentUser = customProviderHooks?.useCurrentUser
      ? customProviderHooks.useCurrentUser
      : // eslint-disable-next-line react-hooks/rules-of-hooks
        useCurrentUser(authImplementation)

    const reauthenticate = useReauthenticate(
      authImplementation,
      setAuthProviderState,
      getCurrentUser,
      skipFetchCurrentUser,
    )

    const hasRole = customProviderHooks?.useHasRole
      ? customProviderHooks.useHasRole(authProviderState.currentUser)
      : // eslint-disable-next-line react-hooks/rules-of-hooks
        useHasRole(authProviderState.currentUser)
    const signUp = useSignUp(
      authImplementation,
      setAuthProviderState,
      getCurrentUser,
      skipFetchCurrentUser,
    )
    const logIn = useLogIn(
      authImplementation,
      setAuthProviderState,
      getCurrentUser,
      skipFetchCurrentUser,
    )
    const logOut = useLogOut(authImplementation, setAuthProviderState)
    const forgotPassword = useForgotPassword(authImplementation)
    const resetPassword = useResetPassword(authImplementation)
    const validateResetToken = useValidateResetToken(authImplementation)
    const type = authImplementation.type
    const client = authImplementation.client

    // Whenever the authImplementation is ready to go, restore auth and
    // reauthenticate
    useEffect(() => {
      async function doRestoreState() {
        await authImplementation.restoreAuthState?.()

        // @MARK(SSR-Auth): Conditionally call reauthenticate, because initial
        // state should come from server (on SSR).
        // If the initial state didn't come from the server - or was restored
        // already - reauthenticate will make a call to receive the current
        // user from the server
        reauthenticate()
      }

      doRestoreState()
    }, [reauthenticate, serverAuthState])

    return (
      <AuthContext.Provider
        value={{
          ...authProviderState,
          signUp,
          logIn,
          logOut,
          getToken,
          getCurrentUser,
          hasRole,
          reauthenticate,
          forgotPassword,
          resetPassword,
          validateResetToken,
          client,
          type,
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  return AuthProvider
}
