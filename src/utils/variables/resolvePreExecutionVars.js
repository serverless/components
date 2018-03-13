const {
  is, not, replace, match, contains, keys, map, test, reduce
} = require('ramda')

const regex = require('./getVariableSyntax')()

module.exports = (slsYml) => {
  const resolveValue = (value) => {
    if (is(Object, value) || is(Array, value)) {
      return map(resolveValue, value)
    }

    if (is(String, value) && test(regex, value)) {
      const referencedVariable = replace(/[${}]/g, '', match(regex, value)[0]).split('.')
      if (referencedVariable[0] === 'input') {
        const referencedInput = referencedVariable[1]
        const inputs = slsYml.inputs // eslint-disable-line

        if (not(contains(referencedInput, keys(inputs)))) {
          throw new Error(`Referenced input does not exist for variable ${referencedVariable.join('.')}`)
        }
        referencedVariable.splice(0, 1)
        return reduce((accum, key) => accum[key], inputs, referencedVariable)
      }
    }
    return value
  }
  return map(resolveValue, slsYml)
}
