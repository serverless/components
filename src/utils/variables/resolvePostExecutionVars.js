const { is, replace, map, path, match } = require('ramda')

const regex = require('./getVariableSyntax')()
const reservedNames = require('./reservedNames')

module.exports = (inputs, components) => {
  const resolveReferenceToValue = (reference) => {
    const referencedVariable = replace(/[${}]/g, '', reference).split('.')
    const referencedComponentId = referencedVariable[0]
    if (!reservedNames.includes(referencedComponentId)) {
      if (components[referencedComponentId] != undefined) {
        const componentVariables = components[referencedComponentId].outputs
        referencedVariable.splice(0, 1)
        const resolvedValue = path(referencedVariable, componentVariables)
        return resolvedValue
      } else if (referencedComponentId == 'myRole') {
        return 'id:iam:role:' + process.env.FUNCTION_NAME
      } else {
        return '${' + referencedVariable.join('.') + '}'
      }
    }
    return reference
  }

  const resolveValue = (value) => {
    if (is(Object, value) || is(Array, value)) {
      return map(resolveValue, value)
    }

    if (is(String, value)) {
      if (match(regex, value)[0] === value) {
        // If the value is a single reference, just return it directly
        // This is necessary for nested or object references
        return resolveReferenceToValue(value)
      }

      return value.replace(regex, (reference) => {
        const resolvedValue = resolveReferenceToValue(reference)
        return resolvedValue
      })
    }
    return value
  }
  return map(resolveValue, inputs)
}
