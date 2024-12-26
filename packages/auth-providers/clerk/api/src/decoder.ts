import type { Decoder } from '@redwoodjs/api'

/**
 * @deprecated This function will be removed; it uses a rate-limited API. Use `clerkAuthDecoder` instead.
 */
export const authDecoder: Decoder = async (token: string, type: string) => {
  if (type !== 'clerk') {
    return null
  }

  const { verifyToken, createClerkClient } = await import(
    '@clerk/clerk-sdk-node'
  )

  try {
    const options = {
      apiUrl: process.env.CLERK_API_URL || 'https://api.clerk.dev',
      jwtKey: process.env.CLERK_JWT_KEY,
      secretKey: process.env.CLERK_SECRET_KEY,
    }

    const jwtPayload = await verifyToken(token, options)

    if (!jwtPayload.sub) {
      return Promise.reject(new Error('Session invalid'))
    }

    const clerkClient = createClerkClient(options)

    const user = await clerkClient.users.getUser(jwtPayload.sub)

    return {
      ...user,
      roles: user.publicMetadata['roles'] ?? [],
    }
  } catch (error) {
    console.error(error)
    return Promise.reject(error)
  }
}

export const clerkAuthDecoder: Decoder = async (
  token: string,
  type: string,
) => {
  if (type !== 'clerk') {
    return null
  }

  const { verifyToken } = await import('@clerk/clerk-sdk-node')

  try {
    const jwtPayload = await verifyToken(token, {
      apiUrl: process.env.CLERK_API_URL || 'https://api.clerk.dev',
      jwtKey: process.env.CLERK_JWT_KEY,
      secretKey: process.env.CLERK_SECRET_KEY,
    })

    if (!jwtPayload.sub) {
      return Promise.reject(new Error('Session invalid'))
    }

    return {
      ...jwtPayload,
      id: jwtPayload.sub,
    }
  } catch (error) {
    console.error(error)
    return Promise.reject(error)
  }
}
