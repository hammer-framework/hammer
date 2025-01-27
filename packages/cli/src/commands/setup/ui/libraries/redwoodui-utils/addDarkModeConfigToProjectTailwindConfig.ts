import type { ListrTaskWrapper } from 'listr2'

import c from '../../../../../lib/colors'

/**
 * Adds the RedwoodUI darkMode TailwindCSS configuration to the project's TailwindCSS configuration.
 * - If the project doesn't have a darkMode config, it will add it.
 * - If the project does have a darkMode config, it will check if it matches the RedwoodUI darkMode config.
 * - If it doesn't match, it will print a warning that the user should check their darkMode config.
 *
 * Rather than writing the new config to the file, it will return the new config as a string.
 * This is so that we can iteratively build up the new config and then write it to the file at the end.
 *
 * Will return the new config if it succeeds, and throw an error if it fails.
 */
const addDarkModeConfigToProjectTailwindConfig = (
  task: ListrTaskWrapper<any, any>,
  rwuiDarkModeConfig: string,
  projectDarkModeConfig: string | null,
  projectTailwindConfig: string,
): string => {
  // if the project doesn't have a darkMode config, add it
  if (!projectDarkModeConfig) {
    // add the rwuiDarkModeConfig to the projectTailwindConfig
    const newConfig = projectTailwindConfig.replace(
      /module.exports = {/,
      `module.exports = {\n  darkMode: ${rwuiDarkModeConfig},`,
    )
    task.output = c.success(
      "Added RedwoodUI's darkMode configuration to your project's TailwindCSS configuration.",
    )

    return newConfig
  } else {
    // if the project does have a darkMode config, check if it matches the rwuiDarkModeConfig
    // if it doesn't match, print a warning that the user should check their darkMode config
    // and possibly update it to match the rwuiDarkModeConfig
    if (projectDarkModeConfig !== rwuiDarkModeConfig) {
      task.output = c.warning(
        `Warning: Your project's TailwindCSS configuration already has a darkMode config that is different from RedwoodUI's, and may not work.\nPlease check your darkMode setting and ensure it matches RedwoodUI's.\n\nRedwoodUI darkMode setting: ${rwuiDarkModeConfig}\nYour project's darkMode setting: ${projectDarkModeConfig}\n\nMore info here: https://tailwindcss.com/docs/dark-mode#customizing-the-selector`,
      )
      throw new Error(
        "Ran into a conflict setting the project's TailwindCSS darkMode configuration.",
      )
    } else {
      task.skip(
        "Your project's TailwindCSS configuration already has the correct darkMode setting.",
      )
      return projectTailwindConfig
    }
  }
}

export default addDarkModeConfigToProjectTailwindConfig
