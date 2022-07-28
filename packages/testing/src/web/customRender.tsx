import React from 'react'

import { render, RenderOptions } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import type {
  RenderHookOptions,
  RenderHookResult,
} from '@testing-library/react-hooks'
// `@testing-library/react-hooks` is being deprecated
// since the functionality is moving into v13 of `@testing-library/react`.
// But v13 of `@testing-library/react` drops support for React 17, so we can't upgrade just yet.
// We can remove `@testing-library/react-hooks` after upgrading Redwood to React 18.
import { renderHook } from '@testing-library/react-hooks/dom'

import { MockProviders } from './MockProviders'

interface CustomRenderOptions extends RenderOptions {
  redwoodProviders?: boolean
}

export const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  return render(ui, {
    wrapper:
      options.redwoodProviders === false
        ? options.wrapper
        : (props) => <MockProviders {...props} />,
    ...options,
  })
}

export const customRenderHook = <Props, Result>(
  render: (props: Props) => Result,
  options?: RenderHookOptions<Props>
): RenderHookResult<Props, Result> => {
  return renderHook(render, {
    wrapper: (props: any) => <MockProviders {...props} />,
    ...options,
  })
}
