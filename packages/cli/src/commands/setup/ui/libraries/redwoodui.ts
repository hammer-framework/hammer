import path from 'path'

import execa from 'execa'
import fs from 'fs-extra'
import type {
  ListrGetRendererTaskOptions,
  ListrTask,
  ListrTaskWrapper,
} from 'listr2'
import { Listr } from 'listr2'
import type { Argv } from 'yargs'

import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'
import type { Paths } from '@redwoodjs/project-config'
import { getPaths } from '@redwoodjs/project-config'
import { errorTelemetry } from '@redwoodjs/telemetry'

import c from '../../../../lib/colors'

import addColorsConfigToProjectTailwindConfig from './redwoodui-utils/addColorsConfigToProjectTailwindConfig'
import addDarkModeConfigToProjectTailwindConfig from './redwoodui-utils/addDarkModeConfigToProjectTailwindConfig'
import addLayerToIndexCSS from './redwoodui-utils/addLayerToIndexCSS'
import addPluginsConfigToProjectTailwindConfig from './redwoodui-utils/addPluginsConfigToProjectTailwindConfig'
import {
  fetchFromRWUIRepo,
  extractTailwindConfigData,
  extractCSSLayers,
  tsFileExistInProject,
  extractPackageImports,
  ensureDirectoryExistence,
  logTaskOutput,
} from './redwoodui-utils/sharedUtils'
import {
  addSBAddonsToMain,
  addSBDarkModeThemesToPreview,
} from './redwoodui-utils/storybookConfigMods'

// TODO add options here, probably at least `force`
// interface RedwoodUIYargsOptions {
// }

export const command = 'redwoodui'
export const aliases = ['rwui']
export const description = 'Set up RedwoodUI'
export function builder(yargs: Argv): Argv {
  // TODO add options
  return yargs
  // .option('force', {
  //   alias: 'f',
  //   default: false,
  //   description:
  //     'Overwrite all existing configuration (NOTE: this will also reset your TailwindCSS configuration!)',
  //   type: 'boolean',
  // })
}

export const handler = async () => {
  recordTelemetryAttributes({
    command: 'setup ui redwoodui',
  })
  const installHandler = new RWUIInstallHandler()

  try {
    await installHandler.getAllTasks().run()
    console.log(
      c.success(
        'RedwoodUI has been successfully set up in your project. Enjoy using RedwoodUI!',
      ),
    )
    if (installHandler.usingStorybook) {
      console.log(
        c.success(
          "Looks like you're using Storybook — to see all the RedwoodUI components, run `yarn rw storybook`.",
        ),
      )
    }
  } catch (e: any) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}

class RWUIInstallHandler {
  rwPaths!: Paths

  projectTailwindConfigPath!: string
  projectIndexCSSPath!: string

  /**
   * If this exists, the user is using Storybook
   */
  projectStorybookMainPath: string | null = null
  /**
   * This may or may not exist, even if the user is using Storybook.
   * It can be TS, TSX, JS, or JSX.
   */
  projectStorybookPreviewPath: string | null = null

  /**
   * The contents of the package.json file from the RedwoodUI repo's web workspace
   * (as that's the only one we care about as a source of truth for dependencies)
   */
  rwuiPackageJson: any

  defaultTaskOptions: ListrGetRendererTaskOptions<any> = {
    persistentOutput: true,
  }

  constructor() {
    this.initGlobalPaths()
    this.initStorybookInfo()
    this.initRemoteFileContents()
  }

  /**
   * A place to house the initialization of paths that don't make sense being initialized elsewhere
   */
  initGlobalPaths() {
    this.rwPaths = getPaths()

    this.projectTailwindConfigPath = path.join(
      this.rwPaths.web.config,
      'tailwind.config.js',
    )
    this.projectIndexCSSPath = path.join(this.rwPaths.web.src, 'index.css')
  }

  /**
   * A place to house the initialization of Storybook-related info
   */
  initStorybookInfo() {
    // The main file can be either JS or TS, even if the project is TS
    const storybookMainPathJS = path.join(this.rwPaths.web.storybook, 'main.js')
    const storybookMainPathTS = path.join(this.rwPaths.web.storybook, 'main.ts')

    // Not using tsFileExistInProject because we specifically want to know which file the user is using
    if (fs.existsSync(storybookMainPathJS)) {
      this.projectStorybookMainPath = storybookMainPathJS
    } else if (fs.existsSync(storybookMainPathTS)) {
      this.projectStorybookMainPath = storybookMainPathTS
    }

    // The preview file can be either TS, JS, TSX, or JSX
    const storybookPreviewPathJS = path.join(
      this.rwPaths.web.storybook,
      'preview.js',
    )
    const storybookPreviewPathTS = path.join(
      this.rwPaths.web.storybook,
      'preview.ts',
    )
    const storybookPreviewPathJSX = path.join(
      this.rwPaths.web.storybook,
      'preview.jsx',
    )
    const storybookPreviewPathTSX = path.join(
      this.rwPaths.web.storybook,
      'preview.tsx',
    )

    if (fs.existsSync(storybookPreviewPathJS)) {
      this.projectStorybookPreviewPath = storybookPreviewPathJS
    } else if (fs.existsSync(storybookPreviewPathTS)) {
      this.projectStorybookPreviewPath = storybookPreviewPathTS
    } else if (fs.existsSync(storybookPreviewPathJSX)) {
      this.projectStorybookPreviewPath = storybookPreviewPathJSX
    } else if (fs.existsSync(storybookPreviewPathTSX)) {
      this.projectStorybookPreviewPath = storybookPreviewPathTSX
    }
  }

  /**
   * A place to house the initialization of remote file contents that is accessed between more than one task
   * so that we don't need to fetch the same file multiple times
   */
  async initRemoteFileContents() {
    const rwuiPackageJsonStr = (await fetchFromRWUIRepo(
      'web/package.json',
    )) as string
    try {
      this.rwuiPackageJson = JSON.parse(rwuiPackageJsonStr)
    } catch (e: any) {
      throw new Error(`Error parsing RedwoodUI's package.json: ${e.message}`)
    }
  }

  get usingStorybook() {
    return !!this.projectStorybookMainPath
  }

  /**
   * Checks if TailwindCSS is set up, calling the setup CLI if it isn't
   */
  getSetupTWTask(): ListrTask {
    return {
      options: this.defaultTaskOptions,
      title: 'Setting up TailwindCSS',
      skip: async () => {
        // if the config already exists, don't need to set up, so skip
        if (
          fs.existsSync(this.projectTailwindConfigPath) &&
          fs.existsSync(this.projectIndexCSSPath)
        ) {
          return 'TailwindCSS is already set up'
        } else {
          return false
        }
      },
      task: async () => {
        // TODO once we add args to the command, we'll likely want to pass any that map over through
        // const argsToInclude: string[] = [
        //   force && '-f',
        // ].filter((item) => item != false)
        await execa(
          'yarn',
          ['rw', 'setup', 'ui', 'tailwindcss'],
          // this is needed so that the output is shown in the terminal.
          // TODO still, it's not perfect, because the output is shown below the others
          // and seems to be swallowing, for example, part of the suggested extensions message.
          { stdio: 'inherit' },
        )
      },
    }
  }

  getConfigTWTask(): ListrTask {
    return {
      options: this.defaultTaskOptions,
      title: 'Merging your TailwindCSS configuration with that of RedwoodUI',
      task: async (_ctx, task) => {
        const rwuiTailwindConfigContent = (await fetchFromRWUIRepo(
          'web/config/tailwind.config.js',
        )) as string

        const projectTailwindConfigContent = fs.readFileSync(
          this.projectTailwindConfigPath,
          'utf-8',
        )

        const rwuiTailwindConfigData = extractTailwindConfigData(
          rwuiTailwindConfigContent,
        )
        const projectTailwindConfigData = extractTailwindConfigData(
          projectTailwindConfigContent,
        )

        let newTailwindConfigContent = projectTailwindConfigContent

        return task.newListr(
          [
            {
              options: { persistentOutput: true },
              title: "Add RedwoodUI's darkMode configuration",
              task: async (_ctx, task) => {
                newTailwindConfigContent =
                  addDarkModeConfigToProjectTailwindConfig(
                    task,
                    // we can safely cast to string because we know it's not null — if it is, something went wrong
                    rwuiTailwindConfigData.darkModeConfig as string,
                    projectTailwindConfigData.darkModeConfig,
                    newTailwindConfigContent,
                  )
              },
            },
            {
              options: { persistentOutput: true },
              title: "Add RedwoodUI's color theme configuration",
              task: async (_ctx, task) => {
                newTailwindConfigContent =
                  addColorsConfigToProjectTailwindConfig(
                    task,
                    // we can safely cast to string because we know it's not null — if it is, something went wrong
                    rwuiTailwindConfigData.colorsConfig as string,
                    projectTailwindConfigData.colorsConfig,
                    newTailwindConfigContent,
                  )
              },
            },
            {
              options: { persistentOutput: true },
              title: "Add RedwoodUI's plugins configuration",
              task: async (_ctx, task) => {
                newTailwindConfigContent =
                  await addPluginsConfigToProjectTailwindConfig(
                    task,
                    // we can safely cast to string because we know it's not null — if it is, something went wrong
                    rwuiTailwindConfigData.pluginsConfig as string,
                    projectTailwindConfigData.pluginsConfig,
                    newTailwindConfigContent,
                  )
              },
            },
            {
              options: { persistentOutput: true },
              title: 'Write out new TailwindCSS configuration',
              skip: () => {
                if (newTailwindConfigContent === projectTailwindConfigContent) {
                  return 'No changes to write to the TailwindCSS configuration file'
                }
                return false
              },
              task: async () => {
                // After all transformations, write the new config to the file
                fs.writeFileSync(
                  this.projectTailwindConfigPath,
                  newTailwindConfigContent,
                )
              },
            },
          ],
          {
            rendererOptions: { collapseSubtasks: false },
            exitOnError: false,
          },
        )
      },
    }
  }

  getAddCSSTask(): ListrTask {
    return {
      title: "Adding RedwoodUI's classes to your project's index.css",
      task: async (_ctx, task) => {
        const rwuiIndexCSSContent = (await fetchFromRWUIRepo(
          'web/src/index.css',
        )) as string

        const projectIndexCSSContent = fs.readFileSync(
          this.projectIndexCSSPath,
          'utf-8',
        )

        const rwuiCSSLayers = extractCSSLayers(rwuiIndexCSSContent)
        const projectCSSLayers = extractCSSLayers(projectIndexCSSContent)

        let newIndexCSSContent = projectIndexCSSContent

        return task.newListr(
          [
            {
              options: { persistentOutput: true },
              title: 'Add base layer',
              task: async (_ctx, task) => {
                newIndexCSSContent = addLayerToIndexCSS(
                  task,
                  'base',
                  // we can safely cast to string because we know it's not null — if it is, something went wrong
                  rwuiCSSLayers.base as string,
                  projectCSSLayers.base,
                  newIndexCSSContent,
                )
              },
            },
            {
              options: { persistentOutput: true },
              title: 'Add components layer',
              task: async (_ctx, task) => {
                newIndexCSSContent = addLayerToIndexCSS(
                  task,
                  'components',
                  // we can safely cast to string because we know it's not null — if it is, something went wrong
                  rwuiCSSLayers.components as string,
                  projectCSSLayers.components,
                  newIndexCSSContent,
                )
              },
            },
            {
              options: { persistentOutput: true },
              title: 'Write out new index.css',
              skip: () => {
                if (newIndexCSSContent === projectIndexCSSContent) {
                  return 'No changes to write to the index.css file'
                }
                return false
              },
              task: async () => {
                // After all transformations, write the new config to the file
                fs.writeFileSync(this.projectIndexCSSPath, newIndexCSSContent)
              },
            },
          ],
          {
            rendererOptions: { collapseSubtasks: false },
            exitOnError: false,
          },
        )
      },
    }
  }

  getAddUtilityFunctionsTask(): ListrTask {
    return {
      options: { persistentOutput: true },
      title: 'Add utility functions used by RedwoodUI',
      task: async (_ctx, task) => {
        const projectRWUIUtilsPath = path.join(
          this.rwPaths.web.src,
          'lib/uiUtils.ts',
        )

        const utilsAlreadyInstalled = tsFileExistInProject(projectRWUIUtilsPath)

        let shouldOverwrite = false

        // give user chance to switch overwrite to true
        if (utilsAlreadyInstalled && !shouldOverwrite) {
          shouldOverwrite = await task.prompt({
            type: 'confirm',
            message:
              "Looks like you've already got the RWUI utilities. Do you want to overwrite them? This may be helpful, for example if you've made changes and want to reset them or if we've made updates.",
            initial: 'no',
          })
        }

        if (utilsAlreadyInstalled && !shouldOverwrite) {
          task.skip("RWUI's utility functions are already installed")
          return
        } else {
          const rwuiUtilsContent = (await fetchFromRWUIRepo(
            'web/src/lib/uiUtils.ts',
          )) as string

          await this._addFileAndInstallPackages(
            task,
            rwuiUtilsContent,
            projectRWUIUtilsPath,
          )
        }
      },
    }
  }

  getAddComponentsTask(): ListrTask {
    return {
      options: { persistentOutput: true },
      title: 'Add RedwoodUI components to your project',
      task: async (_ctx, task) => {
        // top-level components
        const listOfComponentFolders = (await fetchFromRWUIRepo(
          'web/src/ui',
        )) as { name: string; path: string }[]
        // components in sub-directories
        const listOfFormComponentFolders = (await fetchFromRWUIRepo(
          'web/src/ui/formFields',
        )) as { name: string; path: string }[]

        // filter to only directory names that start with a capital letter, as these are the ones that are components
        const componentsAvailable = listOfComponentFolders.filter((val) =>
          /^[A-Z]/.test(val.name),
        )
        const formComponentsAvailable = listOfFormComponentFolders.filter(
          (val) => /^[A-Z]/.test(val.name) && val.name !== 'InputFieldWrapper', // InputFieldWrapper is a shared dependency, and not a regular component
        )

        // TODO add a note next to any components that appear to already be installed
        const selectedComponents = await task.prompt<string[]>({
          type: 'multiselect',
          message:
            'Select the components you want to add to your project (form fields are next):' +
            c.warning(
              '\n🚨 All selected components will be overwritten if they already exist.\nMake sure to back up any important changes before proceeding.\n',
            ),
          hint: 'Use the arrow keys to navigate, space to select, and A to select all',
          choices: [...componentsAvailable.map((component) => component.name)],
        })

        const selectedFormComponents = await task.prompt<string[]>({
          type: 'multiselect',
          message:
            'Select the form components you want to add to your project (type A to select all):' +
            c.warning(
              '\n🚨 All selected components will be overwritten if they already exist.\nMake sure to back up any important changes before proceeding.\n',
            ),
          hint: 'Use the arrow keys to navigate, space to select, and A to select all',
          choices: [
            ...formComponentsAvailable.map((component) => component.name),
          ],
        })

        return task.newListr(
          [
            ...selectedComponents.map(
              (componentToInstall): ListrTask => ({
                options: { persistentOutput: false },
                title: `Install component: ${componentToInstall}`,
                task: async (_ctx, task) => {
                  await this._installComponent(task, componentToInstall)
                },
              }),
            ),
            ...(selectedFormComponents.length > 0
              ? [
                  {
                    options: { persistentOutput: true },
                    title: 'Install shared dependencies for form components',
                    task: async (_ctx, task) => {
                      const sharedDependencies = [
                        'web/src/ui/formFields/inputVariants.ts',
                        'web/src/ui/formFields/groupFieldCommon.tsx',
                        'web/src/ui/formFields/dropdownFieldCommon.tsx',
                        'web/src/ui/formFields/InputFieldWrapper/InputFieldWrapper.tsx',
                      ]

                      const existingFiles = sharedDependencies.filter(
                        (filePath) => tsFileExistInProject(filePath),
                      )

                      let filesToOverwrite: string[] = []
                      if (existingFiles.length > 0) {
                        filesToOverwrite = await task.prompt<string[]>({
                          type: 'multiselect',
                          message:
                            'Select the shared dependencies you want to overwrite:',
                          hint: 'Use the arrow keys to navigate, space to select, and A to select all',
                          choices: existingFiles,
                        })
                      }

                      await Promise.all(
                        sharedDependencies.map(async (filePath) => {
                          if (
                            !tsFileExistInProject(filePath) ||
                            filesToOverwrite.includes(filePath)
                          ) {
                            await this._installFileFromRWUIRepo(task, filePath)
                          }
                        }),
                      )
                    },
                  } as ListrTask,
                ]
              : []),
            ...selectedFormComponents.map(
              (formComponentToInstall): ListrTask => ({
                options: { persistentOutput: false },
                title: `Install form component: ${formComponentToInstall}`,
                task: async (_ctx, task) => {
                  await this._installComponent(
                    task,
                    formComponentToInstall,
                    'form',
                  )
                },
              }),
            ),
          ],
          // exitOnError false because we want to continue even if one of the components fails
          { exitOnError: false },
        )
      },
    }
  }

  getSetUpStorybookTask(): ListrTask {
    return {
      options: { persistentOutput: true },
      title: 'Set up Storybook for RedwoodUI',
      skip: async () => {
        if (!this.usingStorybook) {
          return "This project is not using Storybook. If you do wish to use Storybook, you can set it up with `yarn redwood storybook`\nNote that without Storybook set up, we won't add component stories to your project."
        }

        return false
      },
      task: async (_ctx, task) => {
        return task.newListr([
          {
            options: { persistentOutput: true },
            title: 'Add dark mode support to Storybook',
            task: async (_ctx, task) => {
              const origSBMainContent = fs.readFileSync(
                // We know the user is using Storybook because we checked in the skip function
                this.projectStorybookMainPath as string,
                'utf-8',
              )

              const origSBPreviewContent = this.projectStorybookPreviewPath
                ? fs.readFileSync(this.projectStorybookPreviewPath, 'utf-8')
                : ''

              const newSBMainContent = addSBAddonsToMain(
                task,
                origSBMainContent,
                ['@storybook/addon-themes'],
              )

              const newSBPreviewContent = await addSBDarkModeThemesToPreview(
                task,
                origSBPreviewContent,
              )

              if (
                newSBMainContent == origSBMainContent &&
                newSBPreviewContent == origSBPreviewContent
              ) {
                task.skip(
                  'No changes to make to Storybook main or preview files',
                )
                return
              }

              await this._addFileAndInstallPackages(
                task,
                newSBMainContent,
                this.projectStorybookMainPath as string,
              )
              await this._addFileAndInstallPackages(
                task,
                newSBPreviewContent,
                this.projectStorybookPreviewPath || 'web/.storybook/preview.ts',
              )
            },
          },
          {
            options: { persistentOutput: true },
            title: 'Add story utility components',
            task: async (_ctx, task) => {
              // TODO this hardcodes the possible utility components. Instead,
              // we should fetch the list of utility components from the RWUI repo.

              // in the user's project can be either JSX or TSX, but in RWUI it's always TSX
              const childrenPlaceholderComponentPathJSX = path.join(
                this.rwPaths.web.src,
                'ui/storyUtils/ChildrenPlaceholder.jsx',
              )
              const childrenPlaceholderComponentPathTSX = path.join(
                this.rwPaths.web.src,
                'ui/storyUtils/ChildrenPlaceholder.tsx',
              )
              const rwjsLogoPathJSX = path.join(
                this.rwPaths.web.src,
                'ui/storyUtils/RedwoodJSLogo.jsx',
              )
              const rwjsLogoPathTSX = path.join(
                this.rwPaths.web.src,
                'ui/storyUtils/RedwoodJSLogo.tsx',
              )

              let childrenPlaceholderComponentPath: string | null = null
              if (fs.existsSync(childrenPlaceholderComponentPathJSX)) {
                childrenPlaceholderComponentPath =
                  childrenPlaceholderComponentPathJSX
              } else if (fs.existsSync(childrenPlaceholderComponentPathTSX)) {
                childrenPlaceholderComponentPath =
                  childrenPlaceholderComponentPathTSX
              }
              let rwjsLogoPath: string | null = null
              if (fs.existsSync(rwjsLogoPathJSX)) {
                rwjsLogoPath = rwjsLogoPathJSX
              } else if (fs.existsSync(rwjsLogoPathTSX)) {
                rwjsLogoPath = rwjsLogoPathTSX
              }

              if (childrenPlaceholderComponentPath && rwjsLogoPath) {
                task.skip('Story utility components already exist')
                return
              }

              if (!childrenPlaceholderComponentPath) {
                await this._installFileFromRWUIRepo(
                  task,
                  'web/src/ui/storyUtils/ChildrenPlaceholder.tsx',
                )
              }

              if (!rwjsLogoPath) {
                await this._installFileFromRWUIRepo(
                  task,
                  'web/src/ui/storyUtils/RedwoodJSLogo.tsx',
                )
              }
            },
          },
        ])
      },
    }
  }

  getAllTasks() {
    return new Listr(
      [
        this.getSetupTWTask(),
        this.getConfigTWTask(),
        this.getAddCSSTask(),
        this.getSetUpStorybookTask(),
        this.getAddUtilityFunctionsTask(),
        this.getAddComponentsTask(),
      ],
      { rendererOptions: { collapseSubtasks: false }, exitOnError: true }, // exitOnError true for top-level tasks
    )
  }

  async _addFileAndInstallPackages(
    task: ListrTaskWrapper<any, any>,
    fileContent: string,
    filePath: string,
  ) {
    const dependencies: Record<string, string> =
      this.rwuiPackageJson.dependencies
    const devDependencies: Record<string, string> =
      this.rwuiPackageJson.devDependencies

    const packageImports = extractPackageImports(fileContent)

    const depsToInstall: string[] = []
    const devDepsToInstall: string[] = []

    packageImports.forEach((pkg) => {
      // Find the longest matching package name in dependencies or devDependencies
      // Initiailizing as empty string rather than null because we want to compare lengths
      let matchedPkg = ''
      for (const dep in dependencies) {
        if (pkg.startsWith(dep) && dep.length > matchedPkg.length) {
          matchedPkg = dep
        }
      }
      for (const devDep in devDependencies) {
        if (pkg.startsWith(devDep) && devDep.length > matchedPkg.length) {
          matchedPkg = devDep
        }
      }

      // Sometimes, an internal package will be imported, so it won't be in any listed dependencies
      // eg @radix-ui/react-popper, which doesn't make sense to install separately
      if (matchedPkg === '') {
        return // skip to next iteration
      }

      // Even though RWUI should only use dependencies in web/package.json,
      // we still want to check the root one of the project just in case something
      // was previously installed that way.
      // Also, we do want to run this on every file because of possible shared dependencies between files
      // (aka, the project's package.json files are subject to change).
      const projectRootPackageJsonPath = path.join(
        this.rwPaths.base,
        'package.json',
      )
      const projectWebPackageJsonPath = path.join(
        this.rwPaths.web.base,
        'package.json',
      )
      const projectRootPackageJson = JSON.parse(
        fs.readFileSync(projectRootPackageJsonPath, 'utf-8'),
      )
      const projectWebPackageJson = JSON.parse(
        fs.readFileSync(projectWebPackageJsonPath, 'utf-8'),
      )

      const getMajorVersion = (version: string) => {
        const parsed = parseInt(version.split('.')[0].replace(/\D/g, ''), 10)
        return parsed
      }

      const projectDeps = {
        ...projectRootPackageJson.dependencies,
        ...projectRootPackageJson.devDependencies,
        ...projectWebPackageJson.dependencies,
        ...projectWebPackageJson.devDependencies,
      }

      const projectVersion = projectDeps[matchedPkg]
        ? getMajorVersion(projectDeps[matchedPkg])
        : null
      const rwuiVersion = dependencies[matchedPkg]
        ? getMajorVersion(dependencies[matchedPkg])
        : getMajorVersion(devDependencies[matchedPkg])

      if (projectVersion === null || rwuiVersion > projectVersion) {
        if (dependencies[matchedPkg]) {
          depsToInstall.push(`${matchedPkg}@${dependencies[matchedPkg]}`)
        } else if (devDependencies[matchedPkg]) {
          devDepsToInstall.push(`${matchedPkg}@${devDependencies[matchedPkg]}`)
        }
      }
    })

    if (depsToInstall.length > 0 || devDepsToInstall.length > 0) {
      const outputMessage = `As part of adding the file ${filePath}, need to add the following packages...\n`

      logTaskOutput(task, outputMessage)
    }

    // Install the dependencies
    if (depsToInstall.length > 0) {
      logTaskOutput(task, `As dependencies: ${depsToInstall.join(', ')}\n`)
      await execa('yarn', ['workspace', 'web', 'add', ...depsToInstall])
    }

    // Install the devDependencies
    if (devDepsToInstall.length > 0) {
      logTaskOutput(
        task,
        `As devDependencies: ${devDepsToInstall.join(', ')}\n`,
      )
      await execa('yarn', [
        'workspace',
        'web',
        'add',
        '-D',
        ...devDepsToInstall,
      ])
    }

    // Write the file to the specified path
    fs.writeFileSync(filePath, fileContent)
  }

  /**
   * Installs a component from the RedwoodUI repo into the user's project.
   * Installs any required packages as well.
   *
   * TODO Some components rely on other components. Check, and install as well.
   * One idea of how to do this is to maintain a set of components to install at the class level,
   * and add any extra components to install to that set as we go.
   */
  async _installComponent(
    task: ListrTaskWrapper<any, any>,
    componentName: string,
    componentType: 'standard' | 'form' = 'standard',
  ) {
    const componentFilePath = `web/src/ui/${componentType === 'form' ? 'formFields/' : ''}${componentName}/${componentName}.tsx`

    await this._installFileFromRWUIRepo(task, componentFilePath)
    if (this.usingStorybook) {
      const componentStoriesFilePath = `web/src/ui/${componentType === 'form' ? 'formFields/' : ''}${componentName}/${componentName}.stories.tsx`
      await this._installFileFromRWUIRepo(task, componentStoriesFilePath)
    }

    // Some components have extra files that need to be added. This is a place to add those.
    // TODO automate this by looking at the contents of the component folder in the RWUI repo, or something.
    const extraComponentFiles: Record<string, string[]> = {
      Menu: ['web/src/ui/Menu/menuCommon.tsx'],
    }
    if (extraComponentFiles[componentName]) {
      await Promise.all(
        extraComponentFiles[componentName].map(async (filePath) => {
          await this._installFileFromRWUIRepo(task, filePath)
        }),
      )
    }
  }

  /**
   * Given the path to a file, fetches the file from the RedwoodUI repo and installs it in the user's project.
   * Also installs any required packages.
   */
  async _installFileFromRWUIRepo(
    task: ListrTaskWrapper<any, any>,
    filePath: string,
  ) {
    ensureDirectoryExistence(filePath)

    const fileContent = await fetchFromRWUIRepo(filePath)

    if (Array.isArray(fileContent)) {
      throw new Error(
        `Expected a file, but got a directory at the path: ${filePath}`,
      )
    }

    await this._addFileAndInstallPackages(task, fileContent, filePath)
  }
}
