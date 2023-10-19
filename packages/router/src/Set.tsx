import type { ReactElement, ReactNode } from 'react'
import * as React from 'react'

export type WrapperType<WTProps> = (
  props: WTProps & { children: ReactNode }
) => ReactElement | null

type SetProps<P> = P & {
  // P is the interface for the props that are forwarded to the wrapper
  // components. TypeScript will most likely infer this for you, but if you
  // need to you can specify it yourself in your JSX like so:
  //   <Set<{theme: string}> wrap={ThemeableLayout} theme="dark">
  wrap?: WrapperType<P> | WrapperType<P>[]
  /**
   *`Routes` nested in a `<Set>` with `private` specified require
   * authentication. When a user is not authenticated and attempts to visit
   * the wrapped route they will be redirected to `unauthenticated` route.
   *
   * @deprecated Please use `<PrivateSet>` instead
   */
  private?: boolean
  /** The page name where a user will be redirected when not authenticated */
  unauthenticated?: string
  /**
   * Route is permitted when authenticated and use has any of the provided
   * roles such as "admin" or ["admin", "editor"]
   */
  roles?: string | string[]
  /** Prerender all pages in the set */
  prerender?: boolean
  children: ReactNode
  /** Loading state for auth to distinguish with whileLoading */
  whileLoadingAuth?: () => React.ReactElement | null
  whileLoadingPage?: () => React.ReactElement | null
}

/**
 * TypeScript will often infer the type of the props you can forward to the
 * wrappers for you, but if you need to you can specify it yourself in your
 * JSX like so:
 *   <Set<{theme: string}> wrap={ThemeableLayout} theme="dark">
 */
export function Set<WrapperProps>(_props: SetProps<WrapperProps>) {
  // @MARK: Virtual Component, this is actually never rendered
  // See analyzeRoutes in utils.tsx, inside the isSetNode block

  return null
}

type PrivateSetProps<P> = Omit<
  SetProps<P>,
  'private' | 'unauthenticated' | 'wrap'
> & {
  /** The page name where a user will be redirected when not authenticated */
  unauthenticated: string
  wrap?: WrapperType<P> | WrapperType<P>[]
}

/** @deprecated Please use `<PrivateSet>` instead */
export function Private<WrapperProps>(_props: PrivateSetProps<WrapperProps>) {
  // @MARK Virtual Component, this is actually never rendered
  // See analyzeRoutes in utils.tsx, inside the isSetNode block
  return null
}

export function PrivateSet<WrapperProps>(
  _props: PrivateSetProps<WrapperProps>
) {
  // @MARK Virtual Component, this is actually never rendered
  // See analyzeRoutes in utils.tsx, inside the isSetNode block
  return null
}

export const isSetNode = (
  node: ReactNode
): node is ReactElement<SetProps<any>> => {
  return (
    React.isValidElement(node) &&
    (node.type === Set || node.type === PrivateSet || node.type === Private)
  )
}

export const isPrivateSetNode = (
  node: ReactNode
): node is ReactElement<PrivateSetProps<unknown>> => {
  return React.isValidElement(node) && node.type === PrivateSet
}

// Only identifies <Private> nodes, not <Set private> nodes
export const isPrivateNode = (
  node: ReactNode
): node is ReactElement<SetProps<any>> => {
  return React.isValidElement(node) && node.type === Private
}
