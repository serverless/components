const {
  is, replace, match, map, test
} = require('ramda')

const regex = require('./getVariableSyntax')()

module.exports = (slsYml) => {
  const transformValue = (value) => {
    if (is(Object, value) || is(Array, value)) {
      return map(transformValue, value)
    }
    if (is(String, value) && test(regex, value)) {
      const referencedVariable = replace(/[${}]/g, '', match(regex, value)[0]).split('.')
      const referencedComponentAlias = referencedVariable[0]
      if (referencedComponentAlias !== 'input' && referencedComponentAlias !== 'env') {
        const componentId = slsYml.components[referencedComponentAlias].id
        referencedVariable[0] = componentId
        return `\${${referencedVariable.join('.')}}`
      }
    }
    return value
  }
  return map(transformValue, slsYml)
}
