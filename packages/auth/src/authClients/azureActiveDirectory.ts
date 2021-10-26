import type {
  EndSessionRequest,
  PublicClientApplication as AzureActiveDirectory,
  RedirectRequest,
  SilentRequest,
} from '@azure/msal-browser'

import type { AuthClient } from './'

export type { AzureActiveDirectory }

export type AzureActiveDirectoryClient = AzureActiveDirectory
export interface AzureActiveDirectoryUser {}

export const azureActiveDirectory = (
  client: AzureActiveDirectoryClient
): AuthClient => {
  return {
    type: 'azureActiveDirectory',
    client,
    login: async (options?: RedirectRequest) => client.loginRedirect(options),
    logout: (options?: EndSessionRequest) => client.logoutRedirect(options),
    signup: async (options?: RedirectRequest) => client.loginRedirect(options),
    getToken: async (options?: SilentRequest) => {
      // Default to scopes if options is not passed
      const request = options || {
        scopes: ['openid', 'profile'],
      }

      // The recommended call pattern is to first try to call AcquireTokenSilent,
      // and if it fails with a MsalUiRequiredException, call AcquireTokenXYZ
      // https://github.com/AzureAD/microsoft-authentication-library-for-dotnet/wiki/AcquireTokenSilentAsync-using-a-cached-token
      // NOTE: We are not catching by the `MsalUiRequiredException`, perhaps we can branch off `error.name`
      // if this strategy doesn't work properly.
      try {
        const token = await client.acquireTokenSilent(request)
        return token.idToken
      } catch (err) {
        client.acquireTokenRedirect(request)
      }

      return null
    },
    restoreAuthState: async () => {
      // As we are using the redirect flow, we need to call handleRedirectPromise
      // to complete the flow. As this only should happen on a valid redirect, I think
      // it makes sense to call this in the restoreAuthState method.
      if (window.location.href.includes('#code=')) {
        // Wait for promise
        await client.handleRedirectPromise()

        // Get all accounts
        const accounts = client.getAllAccounts()

        if (accounts.length === 0) {
          // No accounts, so we need to login
          client.loginRedirect()
        } else if (accounts.length === 1) {
          // We have one account, so we can set it as active
          client.setActiveAccount(accounts[0])
        } else {
          // We recieved multiple accounts, so we need to ask the user which one to use
          client.loginRedirect()
        }
      }
    },
    getUserMetadata: async () => {
      return client.getActiveAccount()
    },
  }
}
