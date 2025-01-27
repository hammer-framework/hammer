import type { ListrTaskWrapper } from 'listr2'

import c from '../../../../../lib/colors'

import { logTaskOutput } from './sharedUtils'

/**
 * Adds the RedwoodUI colors TailwindCSS configuration to the project's TailwindCSS configuration.
 * - If the project doesn't have a colors config, it will add it.
 * - If the project does have a colors config, it will check that all required colors are set.
 * - If any required colors are missing, it will add them.
 *
 * Rather than writing the new config to the file, it will return the new config as a string.
 * This is so that we can iteratively build up the new config and then write it to the file at the end.
 *
 * Regardless of whether it was modified, it will return the new config so that multiple
 * of these transformations can be easily chained together.
 */
const addColorsConfigToProjectTailwindConfig = (
  task: ListrTaskWrapper<any, any>,
  rwuiColorsConfig: string,
  projectColorsConfig: string | null,
  projectTailwindConfig: string,
): string => {
  let needToAddTWColorsImport = false
  let configToReturn = projectTailwindConfig

  // Regular expression to match all key-value pairs
  const regex = /(\w+):/g

  // If there is no project colors config to begin with, add the entire RWUI colors config
  if (!projectColorsConfig) {
    // Add the rwuiColorsConfig to the projectTailwindConfig under theme.extend.colors
    // First, check if theme.extend exists in the project config
    const themeExtendMatch = projectTailwindConfig.match(
      /theme:\s*{\s*extend:\s*({[^}]*})/s,
    )
    const themeExtendConfig = themeExtendMatch
      ? themeExtendMatch[1].trim()
      : null

    if (themeExtendConfig) {
      // If theme.extend exists, add the colors to it
      task.output = c.info(
        '`theme.extend` exists in your TailwindCSS config. Adding the required colors to it...',
      )
      configToReturn = projectTailwindConfig.replace(
        /theme:\s*{\s*extend:\s*{[^}]*}/s,
        (match) => {
          return match.replace(
            /extend:\s*{/,
            `extend: {\n      colors: ${rwuiColorsConfig},\n    `,
          )
        },
      )
    } else {
      // If theme.extend does not exist, add theme.extend with colors
      task.output = c.info(
        '`theme.extend` does not exist in your TailwindCSS config. Adding it with the required colors...',
      )
      configToReturn = projectTailwindConfig.replace(
        /module.exports = {/,
        `module.exports = {\n  theme: {\n    extend: {\n      colors: ${rwuiColorsConfig},\n    },\n  },`,
      )
    }

    logTaskOutput(
      task,
      c.success(
        `\nAdded RedwoodUI's colors configuration to your project's TailwindCSS configuration.\nPlease confirm that the config has been added correctly by checking your TailwindCSS config file.`,
      ),
    )

    needToAddTWColorsImport = true
  } else {
    // Here, we know that the project has *some* colors config, but we don't know if it's correct.
    // For example, it's totally possible that a user has added their own colors config to their project.

    // Get all the keys currently in the project's colors config, and all the keys that are required
    // This shouldn't match anything that's in a comment
    const projectKeys = Array.from(
      new Set(
        projectColorsConfig
          ?.split('\n')
          ?.filter(
            (line) =>
              !line.trim().startsWith('//') && !line.trim().startsWith('*'),
          )
          ?.join('\n')
          ?.match(regex)
          ?.map((match) => match.replace(':', '').trim()) || [],
      ),
    )
    const requiredKeys = Array.from(
      new Set(
        rwuiColorsConfig
          .split('\n')
          ?.filter(
            (line) =>
              !line.trim().startsWith('//') && !line.trim().startsWith('*'),
          )
          ?.join('\n')
          ?.match(regex)
          ?.map((match) => match.replace(':', '').trim()) || [],
      ),
    )

    // Check if the project colors config has all the required keys
    const missingKeys = requiredKeys.filter((key) => !projectKeys.includes(key))

    if (missingKeys.length === 0) {
      task.skip(
        "Your project's TailwindCSS configuration already includes all required colors.",
      )
      return projectTailwindConfig
    } else if (missingKeys.length === requiredKeys.length) {
      // If all keys are missing, add the entire RWUI colors config to the bottom of the project colors config
      const rwuiColorsConfigWithoutBraces = rwuiColorsConfig
        .replace(/^{|}$/g, '')
        .trim()

      configToReturn = projectTailwindConfig.replace(
        /colors:\s*{[^}]*}/s,
        (match) => {
          return match.replace(/{[^}]*}/s, (innerMatch) => {
            return innerMatch.replace(
              /}$/,
              `  ${rwuiColorsConfigWithoutBraces}\n      }`,
            )
          })
        },
      )
      logTaskOutput(
        task,
        c.success(
          `\nLooks like you already had some custom colors config — added RedwoodUI's colors configuration to your project's TailwindCSS configuration.\nPlease confirm that the config has been added correctly by checking your TailwindCSS config file.`,
        ),
      )

      needToAddTWColorsImport = true
    } else {
      // If there are only some missing keys, warn the user to consult the RedwoodUI
      // config and add the missing keys to their project's config
      task.output = c.warning(
        `Your project's TailwindCSS configuration is missing some required colors.\nIf this happened, it's likely you're already using some of the color names required by RedwoodUI, so we haven't overwritten them.\nPlease check your colors configuration and ensure it also includes the following keys:\n${missingKeys.join(', ')}`,
      )
      throw new Error(
        "Ran into a conflict setting the project's TailwindCSS colors configuration.",
      )
    }
  }

  if (needToAddTWColorsImport) {
    // Rather than extracting this from the RWUI colors config, we'll just hardcode it
    // because it's unlikely to change unless we fundamentally change how we do the default theme.
    const colorsImport = "const colors = require('tailwindcss/colors')\n\n"
    // Check if the project has the colors import
    if (!configToReturn.includes(colorsImport)) {
      // Add the colors import to the top of the file
      configToReturn = colorsImport + configToReturn
      logTaskOutput(
        task,
        c.success(
          '\nAdded TailwindCSS color pallette import (used by TWUI default colors) to your config.',
        ),
      )
    } else {
      task.skip(
        'Your TailwindCSS config already includes the TailwindCSS color pallette import (used by TWUI default colors), so we did not add it again.',
      )
    }
  }

  return configToReturn
}

export default addColorsConfigToProjectTailwindConfig
