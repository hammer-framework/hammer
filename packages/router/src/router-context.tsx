import React, { useReducer, createContext, useContext } from 'react'

import type { AuthContextInterface } from '@redwoodjs/auth'
import { useNoAuth } from '@redwoodjs/auth'

import type { ParamType, analyzeRoutes } from './util'

type UseAuth = () => AuthContextInterface<
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown
>

export interface RouterState {
  paramTypes?: Record<string, ParamType>
  useAuth: UseAuth
  routes: ReturnType<typeof analyzeRoutes>
}

const RouterStateContext = createContext<RouterState | undefined>(undefined)

export interface RouterSetContextProps {
  setState: (newState: Partial<RouterState>) => void
}

const RouterSetContext = createContext<
  React.Dispatch<Partial<RouterState>> | undefined
>(undefined)

/***
 *
 * This file splits the context into getter and setter contexts.
 * This was originally meant to optimize the number of redraws
 * See https://kentcdodds.com/blog/how-to-optimize-your-context-value
 *
 */
export interface RouterContextProviderProps
  extends Omit<RouterState, 'useAuth'> {
  useAuth?: UseAuth
  routes: ReturnType<typeof analyzeRoutes>
  children: React.ReactNode
}

function stateReducer(state: RouterState, newState: Partial<RouterState>) {
  return { ...state, ...newState }
}

export const RouterContextProvider: React.FC<RouterContextProviderProps> = ({
  useAuth,
  paramTypes,
  routes,
  children,
}) => {
  const [state, setState] = useReducer(stateReducer, {
    useAuth: useAuth || useNoAuth,
    paramTypes,
    routes,
  })

  return (
    <RouterStateContext.Provider value={state}>
      <RouterSetContext.Provider value={setState}>
        {children}
      </RouterSetContext.Provider>
    </RouterStateContext.Provider>
  )
}

export const useRouterState = () => {
  const context = useContext(RouterStateContext)

  if (context === undefined) {
    throw new Error(
      'useRouterState must be used within a RouterContextProvider'
    )
  }

  return context
}
