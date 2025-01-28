import { useCallback } from 'react'

import type { AuthImplementation } from '../AuthImplementation.js'

export const useResetPassword = <
  TUser,
  TRestoreAuth,
  TLogInOptions,
  TLogIn,
  TLogOutOptions,
  TLogOut,
  TSignUpOptions,
  TSignUp,
  TGetTokenOptions,
  TForgotPassword,
  TResetPasswordOptions,
  TResetPassword,
>(
  authImplementation: AuthImplementation<
    TUser,
    TRestoreAuth,
    TLogInOptions,
    TLogIn,
    TLogOutOptions,
    TLogOut,
    TSignUpOptions,
    TSignUp,
    TGetTokenOptions,
    TForgotPassword,
    TResetPasswordOptions,
    TResetPassword
  >,
) => {
  return useCallback(
    async (options?: TResetPasswordOptions) => {
      if (authImplementation.resetPassword) {
        return await authImplementation.resetPassword(options)
      } else {
        throw new Error(
          `Auth client ${authImplementation.type} does not implement this function`,
        )
      }
    },
    [authImplementation],
  )
}
