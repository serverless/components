const {
  is, not, replace, match, contains, keys, map, test, reduce
} = require('ramda')

// todo
//  multiple variable references
//  variables as substring
module.exports = (slsYml) => {
  const regex = RegExp('\\${([ ~:a-zA-Z0-9._\'",\\-\\/\\(\\)]+?)}', 'g') // eslint-disable-line

  const resolveValue = (value) => {
    if (is(Object, value) || is(Array, value)) {
      return map(resolveValue, value)
    }

    if (is(String, value) && test(regex, value)) {
      const referencedVariable = replace(/[${}]/g, '', match(regex, value)[0]).split('.')
      if (referencedVariable.length === 1) {
        return process.env[referencedVariable]
      } else if (referencedVariable[1] === 'inputs') {
        const referencedComponentAlias = referencedVariable[0]
        const referencedInput = referencedVariable[2]

        let inputs
        if (referencedComponentAlias === slsYml.type) {
          inputs = slsYml.inputs // eslint-disable-line
        } else if (contains(referencedComponentAlias, keys(slsYml.components || {}))) {
          inputs = slsYml.components[referencedComponentAlias].inputs // eslint-disable-line
        } else {
          throw new Error(`Referenced component does not exist for variable ${referencedVariable.join('.')}`)
        }

        if (not(contains(referencedInput, keys(inputs)))) {
          throw new Error(`Referenced input does not exist for variable ${referencedVariable.join('.')}`)
        }
        referencedVariable.splice(0, 2)
        return reduce((accum, key) => accum[key], inputs, referencedVariable)
      }
    }
    return value
  }
  return map(resolveValue, slsYml)
}
