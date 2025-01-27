import type { ListrTaskWrapper } from 'listr2'

import c from '../../../../../lib/colors'

import {
  addImportStatementToFile,
  fetchFromRWUIRepo,
  logTaskOutput,
} from './sharedUtils'

/**
 * Adds a new property and value to the default export object in a given TypeScript content string.
 *
 * @param content - The content of the TypeScript file as a string.
 * @param property - The property name to add to the default export object.
 * @param value - The value to assign to the new property.
 * @returns The modified content string with the new property and value added to the default export object.
 *
 * The function handles two cases:
 * 1. When the default export is assigned to a named object, with or without a type annotation.
 * 2. When the default export is an inline object.
 */
const addToDefaultExport = (
  task: ListrTaskWrapper<any, any>,
  content: string,
  property: string,
  value: string,
): string => {
  // Handle case where default export is a named object (with or without type annotation)
  const namedExportRegex = /export\s+default\s+(\w+)/
  const namedExportMatch = content.match(namedExportRegex)

  if (namedExportMatch) {
    logTaskOutput(
      task,
      c.info(
        `Found named default export object, adding property '${property}'...`,
      ),
    )
    const objectName = namedExportMatch[1]
    const namedObjectRegex = new RegExp(
      `(const|let|var)\\s+${objectName}(?:\\s*:\\s*[^=]+)?\\s*=\\s*({(?:[^{}]*|\{(?:[^{}]*|\{[^{}]*\})*\})*})`,
      'm',
    )

    logTaskOutput(
      task,
      c.info(`Looking for object definition of '${objectName}'...`),
    )

    const addPropertyToObject = (
      objectContent: string,
      property: string,
      value: string,
    ): string => {
      const objectRegex = /({(?:[^{}]*|\{(?:[^{}]*|\{[^{}]*\})*\})*})/
      return objectContent.replace(objectRegex, (match) => {
        const newObjectContent = match
          .trim()
          .replace(/}\s*$/, `\n  ${property}: ${value}\n}`)
        return newObjectContent
      })
    }

    return content.replace(
      namedObjectRegex,
      (match, declaration, objectContent) => {
        const newObjectContent = addPropertyToObject(
          objectContent,
          property,
          value,
        )
        return match.replace(objectContent, newObjectContent)
      },
    )
  }

  // Handle case where default export is an inline object
  const inlineExportRegex =
    /export\s+default\s+({(?:[^{}]*|\{(?:[^{}]*|\{[^{}]*\})*\})*})/
  const inlineExportMatch = content.match(inlineExportRegex)

  if (inlineExportMatch) {
    logTaskOutput(
      task,
      c.info(
        `Found inline default export object, adding property '${property}'...`,
      ),
    )
    const objectContent = inlineExportMatch[1]
    const newObjectContent = objectContent
      .trim()
      .replace(/}\s*$/, `\n  ${property}: ${value}\n}`)
    return content.replace(objectContent, newObjectContent)
  }

  // Throw error if no default export found
  throw new Error('No default export found in the given content:\n' + content)
}

/**
 * Reads and modifies the Storybook config main file to add the addons passed in.
 * If all addons are already included in the main file, it will return the original content.
 *
 * Takes in the current main file content and returns the new content.
 * Does not install any packages.
 */
export const addSBAddonsToMain = (
  task: ListrTaskWrapper<any, any>,
  sbMainContent: string,
  addOnsToAdd: string[],
): string => {
  logTaskOutput(
    task,
    c.info(
      `Confirming Storybook has the following addons: ${addOnsToAdd.join(', ')}...`,
    ),
  )
  const addonsArrayMatch = sbMainContent.match(/addons\s*:\s*\[([^\]]*)\]/)

  if (addonsArrayMatch) {
    const addonsArray = addonsArrayMatch[1]
    const addonsToAdd = addOnsToAdd.filter(
      (addon) => !addonsArray.includes(addon),
    )

    if (addonsToAdd.length > 0) {
      logTaskOutput(
        task,
        c.info(`Adding addons: ${addonsToAdd.join(', ')} to your Storybook...`),
      )
      const updatedAddonsArray = addonsArray.trim()
        ? `${addonsArray}, ${addonsToAdd.map((addon) => `'${addon}'`).join(', ')}`
        : `${addonsToAdd.map((addon) => `'${addon}'`).join(', ')}`
      return sbMainContent.replace(
        addonsArrayMatch[0],
        `addons: [${updatedAddonsArray}]`,
      )
    } else {
      return sbMainContent
    }
  } else {
    const addonsValue = `[${addOnsToAdd.map((addon) => `'${addon}'`).join(', ')}]`
    return addToDefaultExport(task, sbMainContent, 'addons', addonsValue)
  }
}

/**
 * Reads and modifies the Storybook preview file to add the dark/light mode themes.
 * If any dark/light mode themes are already included in the preview file, it will return the original content.
 *
 * Takes in the current preview file content and returns the new content.
 * Does not install any packages.
 */
export const addSBDarkModeThemesToPreview = async (
  task: ListrTaskWrapper<any, any>,
  sbPreviewContent: string,
): Promise<string> => {
  if (!sbPreviewContent) {
    logTaskOutput(
      task,
      "Doesn't look like you have a Storybook preview file yet. Adding one now with dark/light mode themes...",
    )
    return (await fetchFromRWUIRepo('web/.storybook/preview.ts')) as string
  }

  logTaskOutput(
    task,
    c.info('Adding dark/light mode themes to your preview file...'),
  )
  const hasDarkModeThemes =
    /themes:\s*{\s*light:\s*'light',\s*dark:\s*'dark',\s*}/.test(
      sbPreviewContent,
    )

  if (hasDarkModeThemes) {
    logTaskOutput(
      task,
      c.info(
        'Your Storybook preview file already includes dark/light mode themes. Skipping...',
      ),
    )
    return sbPreviewContent
  }

  sbPreviewContent = addImportStatementToFile(
    sbPreviewContent,
    '@storybook/addon-styling',
    ['withThemeByDataAttribute'],
  )
  sbPreviewContent = addImportStatementToFile(
    sbPreviewContent,
    '@storybook/react',
    ['ReactRenderer'],
  )

  const decoratorsArrayMatch = sbPreviewContent.match(
    /decorators\s*:\s*\[([^\]]*)\]/,
  )

  if (decoratorsArrayMatch) {
    const decoratorsArray = decoratorsArrayMatch[1]

    if (!decoratorsArray.includes('withThemeByDataAttribute')) {
      const updatedDecoratorsArray = decoratorsArray.trim()
        ? `${decoratorsArray.trim()},
    withThemeByDataAttribute<ReactRenderer>({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
      attributeName: 'data-mode',
    }),`
        : `
    withThemeByDataAttribute<ReactRenderer>({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
      attributeName: 'data-mode',
    }),
  `
      return sbPreviewContent.replace(
        decoratorsArrayMatch[0],
        `decorators: [${updatedDecoratorsArray}]`,
      )
    } else {
      return sbPreviewContent
    }
  } else {
    const decoratorsValue = `[
    withThemeByDataAttribute<ReactRenderer>({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
      attributeName: 'data-mode',
    }),
  ]`
    return addToDefaultExport(
      task,
      sbPreviewContent,
      'decorators',
      decoratorsValue,
    )
  }
}
