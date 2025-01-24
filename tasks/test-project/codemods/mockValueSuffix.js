const stringWithSuffixRegex = /String\d+$/

export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  // Replaces the randomly generated value with a consistent one
  return root
    .find(j.Literal, { type: 'StringLiteral' })
    .forEach((obj) => {
      const stringValue = obj.value.value
      if (stringWithSuffixRegex.test(stringValue)) {
        obj.value.value = `String${obj.value.loc.start.line}`
      }
    })
    .toSource()
}
