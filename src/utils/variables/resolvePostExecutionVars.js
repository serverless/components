const {
  is, replace, map, reduce, match
} = require('ramda')

const regex = require('./getVariableSyntax')()

module.exports = (inputs, components) => {
  const resolveReferenceToValue = (reference) => {
    const referencedVariable = replace(/[${}]/g, '', reference).split('.')
    const referencedComponentId = referencedVariable[0]
    if (referencedComponentId !== 'input' && referencedComponentId !== 'env') {
      const componentVariables = components[referencedComponentId].outputs
      referencedVariable.splice(0, 1)
      const resolvedValue = reduce(
        (accum, key) => accum[key],
        componentVariables,
        referencedVariable
      )
      return resolvedValue
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
        if (is(Object, resolvedValue)) {
          throw new Error(`Cannot concatenate object reference ${reference} with string`)
        }
        return resolvedValue
      })
    }
    return value
  }
  return map(resolveValue, inputs)
}
