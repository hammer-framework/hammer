import React from 'react'

import { renderToString } from 'react-dom/server'

import type { RenderCallback } from '@redwoodjs/web'
// @TODO (ESM), use exports field. Cannot import from web because of index exports
import { ServerInjectedHtml } from '@redwoodjs/web/dist/components/ServerInject'

import { encodeText } from './encode-decode'

export function createServerInjectionTransform({
  injectionState,
}: {
  injectionState: Set<RenderCallback>
}) {
  const transformStream = new TransformStream({
    transform(chunk, controller) {
      const mergedBytes = insertHtml(chunk)
      controller.enqueue(mergedBytes)
    },
    flush(controller) {
      // Before you finish, flush injected HTML again
      const mergedBytes = insertHtml()
      controller.enqueue(mergedBytes)

      // @TODO code for moving meta/links to head. This is called "Float"
      // and should be handled by React, but unsure which version its in
      const moveTagsScript =
        encodeText(`<script>document.querySelectorAll('body [data-rwjs-head]').forEach((el) => {
        document.querySelectorAll('head ' + el.tagName).forEach((e) => {
          if (
            el.tagName === 'TITLE' ||
            (el.tagName === 'META' &&
              el.getAttribute('name') === e.getAttribute('name') &&
              el.getAttribute('property') === e.getAttribute('property'))
          ) {
            e.remove();
          }
          document.head.appendChild(el);
        });
      });
        </script>`)

      controller.enqueue(moveTagsScript)
    },
  })

  return transformStream

  function insertHtml(chunk?: Uint8Array) {
    const serverHtmlOutput = renderToString(
      React.createElement(ServerInjectedHtml, {
        injectionState,
      })
    )

    const injectedBytes = encodeText(serverHtmlOutput)

    if (chunk !== undefined) {
      const mergedBytes = new Uint8Array(chunk.length + injectedBytes.length)

      mergedBytes.set(chunk)

      // @MARK: don't forget the offset! (second param)
      // We are injecting stuff after the original chunk
      mergedBytes.set(injectedBytes, chunk.length)
      return mergedBytes
    } else {
      const injectedHtmlOutput = new Uint8Array(injectedBytes.length)
      injectedHtmlOutput.set(injectedBytes)

      return injectedHtmlOutput
    }
  }
}
