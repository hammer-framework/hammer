import type _React from 'react'

import type _gql from 'graphql-tag'
import type _PropTypes from 'prop-types'

declare global {
  const React: typeof _React
  const PropTypes: typeof _PropTypes
  const gql: typeof _gql

  interface Window {
    __REDWOOD__API_PROXY_PATH: string
  }

  // Overridable graphQL hook return types
  interface QueryOperationResult<TData = any> {
    data: TData | undefined
    loading: boolean

    // @TODO Adding error here causes a problem with Apollo, because TS thinks this is the override, not the apollo one
    // Not really a problem, but the types in createCell aren't a 100% acurate
    // error?: Error | any
  }

  // not defining it here, because it gets overriden by Apollo provider anyway
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface MutationOperationResult<TData = any, TVariables = any> {}
}
