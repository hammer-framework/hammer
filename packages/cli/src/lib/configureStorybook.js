import fs from 'fs-extra'

import { getPaths } from '.'

/**
 * Configure Storybook for the given template by creating a custom preview config
 */
export default function configureStorybook({ force }, newStorybookPreview) {
  const storybookPreviewConfigPath = getPaths().web.storybookPreviewConfig

  let storybookPreviewConfig
  /**
   *  Check if storybookPreviewConfigPath already exists.
   *  Merge both files if it does.
   *  By removing import react and export decorator from new config
   *  And put new config inside current config after last import
   */
  if (fs.existsSync(storybookPreviewConfigPath)) {
    if (force) {
      fs.unlinkSync(storybookPreviewConfigPath)
      storybookPreviewConfig = newStorybookPreview
    } else {
      const currentConfig = fs
        .readFileSync(storybookPreviewConfigPath)
        .toString()

      const newDecoratorsName = newStorybookPreview.match(
        /export const decorators = \[(.*?)\]/
      )[1]

      const currentDecoratorsName = currentConfig.match(
        /export const decorators = \[(.*?)\]/
      )[1]

      const decoratorsExport = `export const decorators = [${currentDecoratorsName}, ${newDecoratorsName}]`

      const insideNewStorybookConfigWithoutReactAndDecoration =
        newStorybookPreview
          .replace(/import \* as React from 'react'/, '')
          .replace(/export const decorators = .*/, '')

      const currentConfigWithoutDecoration = currentConfig.replace(
        /export const decorators = .*/,
        ''
      )

      const reversedCurrentConfig = currentConfigWithoutDecoration
        .split('\n')
        .reverse()

      const indexOfLastImport = reversedCurrentConfig.findIndex((value) =>
        /^import /.test(value)
      )
      reversedCurrentConfig.splice(
        indexOfLastImport,
        0,
        insideNewStorybookConfigWithoutReactAndDecoration
      )
      storybookPreviewConfig =
        reversedCurrentConfig.reverse().join(`\n`) +
        `\n` +
        currentConfig +
        `\n` +
        decoratorsExport
    }
  } else {
    storybookPreviewConfig = newStorybookPreview
  }

  fs.outputFileSync(storybookPreviewConfigPath, storybookPreviewConfig)
}
