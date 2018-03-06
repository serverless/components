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
      const referencedSource = referencedVariable[1]
      if (referencedSource === 'outputs' || referencedSource === 'state') {
        const referencedVariableKey = referencedVariable[2]
        const componentVariables = components[referencedComponentId][referencedSource]
        if (!referencedVariableKey) {
          return componentVariables
        }
        referencedVariable.splice(0, 2)
        return reduce((accum, key) => accum[key], componentVariables, referencedVariable)
      }
    }
    return value
  }
  return map(resolveValue, inputs)
}
