const {
  is, replace, match, map, test, reduce
} = require('ramda')

const regex = require('./getVariableSyntax')()

module.exports = (inputs, components) => {
  const resolveValue = (value) => {
    if (is(Object, value) || is(Array, value)) {
      return map(resolveValue, value)
    }

    if (is(String, value) && test(regex, value)) {
      const referencedVariable = replace(/[${}]/g, '', match(regex, value)[0]).split('.')
      const referencedComponentId = referencedVariable[0]
      if (referencedComponentId !== 'input') {
        const componentVariables = components[referencedComponentId].outputs
        referencedVariable.splice(0, 1)
        return reduce((accum, key) => accum[key], componentVariables, referencedVariable)
      }
    }
    return value
  }
  return map(resolveValue, inputs)
}
