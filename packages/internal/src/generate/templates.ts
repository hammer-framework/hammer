import fs from 'node:fs'
import path from 'node:path'

/**
 * Write the contents of the template to the destination and interpolate the variables.
 * The template is a string that uses standard es6 template literals which allow embded expression.
 */
export const writeTemplate = (
  templatePath: string,
  destination: string,
  templateValues: Record<string, unknown> = {}
) => {
  const templateString = fs.readFileSync(
    path.join(__dirname, templatePath),
    'utf-8'
  )

  const template = templatized(templateString, templateValues)
  fs.writeFileSync(
    destination,
    '// This file was generated by RedwoodJS\n' + template
  )
}

const templatized = (template: string, vars = {}) => {
  const handler = new Function(
    'vars',
    [
      'const tagged = ( ' + Object.keys(vars).join(', ') + ' ) =>',
      '`' + template + '`',
      'return tagged(...Object.values(vars))',
    ].join('\n')
  )

  return handler(vars)
}
