const {
  is, replace, match, map, test
} = require('ramda')

// todo
//  multiple variable references
//  variables as substring
module.exports = (slsYml, componentId) => {
  const regex = RegExp('\\${([ ~:a-zA-Z0-9._\'",\\-\\/\\(\\)]+?)}', 'g') // eslint-disable-line

  const resolveValue = (value) => {
    if (is(Object, value) || is(Array, value)) {
      return map(resolveValue, value)
    }
    if (is(String, value) && test(regex, value)) {
      const referencedVariable = replace(/[${}]/g, '', match(regex, value)[0]).split('.')
      if (referencedVariable[1] === 'outputs' || referencedVariable[1] === 'state') {
        const referencedComponentAlias = referencedVariable[0]
        referencedVariable.splice(0, 1)

        if (referencedComponentAlias === slsYml.type) {
          return `\${${componentId}.${referencedVariable.join('.')}}`
        }
        return `\${${componentId}:${referencedComponentAlias}.${referencedVariable.join('.')}}`
      }
    }
    return value
  }
  return map(resolveValue, slsYml)
}
