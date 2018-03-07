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
      if (referencedVariable[1] === 'outputs' || referencedVariable[1] === 'state') {
        const referencedComponentAlias = referencedVariable[0]

        let componentId
        if (referencedComponentAlias === slsYml.type) {
          componentId = slsYml.id
        } else {
          componentId = slsYml.components[referencedComponentAlias].id
        }
        referencedVariable.splice(0, 1)
        return `\${${componentId}.${referencedVariable.join('.')}}`
      }
    }
    return value
  }
  return map(transformValue, slsYml)
}
