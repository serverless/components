const {
  is, replace, map
} = require('ramda')

const regex = require('./getVariableSyntax')()

module.exports = (slsYml) => {
  const transformValue = (value) => {
    if (is(Object, value) || is(Array, value)) {
      return map(transformValue, value)
    }
    if (is(String, value)) {
      return value.replace(regex, (reference) => {
        const referencedVariable = replace(/[${}]/g, '', reference).split('.')
        const referencedComponentAlias = referencedVariable[0]
        if (referencedComponentAlias !== 'input' && referencedComponentAlias !== 'env') {
          const componentId = slsYml.components[referencedComponentAlias].id
          referencedVariable[0] = componentId
          return `\${${referencedVariable.join('.')}}`
        }
        return reference
      })
    }
    return value
  }
  return map(transformValue, slsYml)
}
