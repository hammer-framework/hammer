import type { ListrTaskWrapper } from 'listr2'

import c from '../../../../../lib/colors'

import { logTaskOutput } from './sharedUtils'

const addLayerToIndexCSS = (
  task: ListrTaskWrapper<any, any>,
  layerName: 'base' | 'components',
  rwuiLayerContentToAdd: string,
  projectLayerContent: string | null,
  projectIndexCSS: string,
): string => {
  let newCSSContent = projectIndexCSS
  if (!projectLayerContent) {
    // If the project doesn't have the layer, check if there's an empty one or none at all.
    // Doesn't include if commented out.
    const hasEmptyLayer = projectIndexCSS
      .split('\n')
      .some(
        (line) =>
          line.includes(`@layer ${layerName} {`) &&
          !line.trim().startsWith('//') &&
          !line.trim().startsWith('*'),
      )

    // If there's an empty layer, replace it with the RWUI layer.
    if (hasEmptyLayer) {
      newCSSContent = projectIndexCSS.replace(
        new RegExp(`@layer ${layerName} {[^}]*}`, 's'),
        `@layer ${layerName} {\n  ${rwuiLayerContentToAdd}\n}`,
      )
      task.output = c.success(
        `Added RedwoodUI's ${layerName} layer to your project's index.css.`,
      )
    } else {
      // If there's no base layer, add the RWUI base layer to the end of the file.
      newCSSContent =
        projectIndexCSS +
        `\n@layer ${layerName} {\n  ${rwuiLayerContentToAdd}\n}`
      task.output = c.success(
        `Added RedwoodUI's ${layerName} layer to your project's index.css.`,
      )
    }
  } else {
    // If the project does have the layer, check whether its classes have the same name as those of the RWUI layer.
    // Note that in the base layer, these are HTML tags, not classes. Therefore, they won't start with a dot.
    // In the components layer, they will start with a dot, and can also be concatenated with other classes (e.g. `.rw-button .primary`).
    const classPattern =
      layerName === 'base'
        ? /[a-zA-Z0-9_-]+(?=\s*\{)/g
        : /\.([a-zA-Z0-9_-]+(?:\s+\.[a-zA-Z0-9_-]+)*)(?=\s*\{)/g

    // Creating two lists here: one to iterate over, and one that we can safely
    // remove items from without affecting the iteration.
    // If we don't do this, it'll skip items when doing the .forEach loop.
    const potentialClassesToAdd: string[] =
      rwuiLayerContentToAdd.match(classPattern) || []
    const classesToAdd = [...potentialClassesToAdd]

    // For each class that we want to add, check if it already exists in the project's layer.
    // If it does, check if it's the same as the RWUI layer class.
    // If it is, remove it from the list of classes to add.
    // If it's not, add it to a list of conflicting classes.
    const conflictingClasses: string[] = []

    potentialClassesToAdd.forEach((className) => {
      const classRegex = new RegExp(`(${className}\\s*{[^}]*})`, 's')
      const rwuiClassMatch = rwuiLayerContentToAdd.match(classRegex)
      const projectClassMatch = projectLayerContent.match(classRegex)

      if (projectClassMatch) {
        // If the class exists in the project's layer, check if it's the same as the RWUI layer class.
        // TODO: This is a naive check. It doesn't account for whitespace or ordering differences.
        if (rwuiClassMatch && rwuiClassMatch[0] === projectClassMatch[0]) {
          // If it is the same, just remove it from the list of classes to add.
          classesToAdd.splice(classesToAdd.indexOf(className), 1)
        } else {
          // If it's not the same, add it to the list of conflicting classes and remove it from the list of classes to add.
          conflictingClasses.push(className)
          classesToAdd.splice(classesToAdd.indexOf(className), 1)
        }
      }
    })

    // Now, if there's no conflicting classes or classes to add, we don't need to do anything more.
    if (conflictingClasses.length === 0 && classesToAdd.length === 0) {
      task.skip(
        `Your project's ${layerName} layer already has the correct classes.`,
      )
      return projectIndexCSS
    } else if (classesToAdd.length > 0) {
      // If there are classes to add, add them.
      // Remember that right now we just have a list of class names, not the full class definition,
      // so we need to create the list of class definitions to add.
      const classesToAddString = classesToAdd
        .map((className) => {
          const classRegex = new RegExp(`(${className}\\s*{[^}]*})`, 's')
          const rwuiClassMatch = rwuiLayerContentToAdd.match(classRegex)
          return rwuiClassMatch ? rwuiClassMatch[0] : ''
        })
        .join('\n  ')

      newCSSContent = addToEndOfLayer(
        layerName,
        classesToAddString,
        projectIndexCSS,
      )
      task.output = c.success(
        `Added the following missing classes to your project's ${layerName} layer in index.css:\n` +
          `${classesToAdd.join(', ')}`,
      )
      if (conflictingClasses.length > 0) {
        logTaskOutput(
          task,
          c.warning(
            `\nSome classes in RedwoodUI's ${layerName} layer were not added to your project's ${layerName} layer because they conflict with existing classes.\nPlease review the following classes in the ${layerName} layer of your index.css:\n` +
              `${conflictingClasses.join(', ')}`,
          ),
        )
      }
    } else {
      // If there are no classes to add, but there are conflicting classes, throw an error.
      throw new Error(
        `Added no classes to your project's ${layerName} layer, because they all conflicted with your existing classes.\nPlease review the following classes in the ${layerName} layer of your index.css:\n` +
          `${conflictingClasses.join(', ')}`,
      )
    }
  }

  return newCSSContent
}

export default addLayerToIndexCSS

const addToEndOfLayer = (
  layerName: string,
  layerContent: string,
  cssFileContent: string,
): string => {
  return cssFileContent.replace(
    new RegExp(`(@layer ${layerName}\\s*{)([^{}]*(?:{[^{}]*}[^{}]*)*)}`, 's'),
    `$1$2  ${layerContent}\n}`,
  )
}
