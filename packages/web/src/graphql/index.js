import ApolloClient from 'apollo-boost'
import { ApolloProvider } from '@apollo/react-hooks'

import { __REDWOOD__ } from 'src/config'
export { withCell } from './withCell'

const DEFAULT_CLIENT_CONFIG = {
  uri: `${__REDWOOD__.API_PROXY_PATH}/graphql`,
}

/**
 * Creates a GraphQL Client (Apollo) that points to the `apiProxyPath` that's
 * specified in `redwood.toml`.
 */
export const createGraphQLClient = (config) => {
  return new ApolloClient({ ...DEFAULT_CLIENT_CONFIG, ...config })
}

/**
 * A GraphQL provider that instantiates a client automatically.
 */
export const GraphQLProvider = ({
  client = createGraphQLClient(),
  ...rest
}) => {
  return <ApolloProvider client={client} {...rest} />
}
