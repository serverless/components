const {
  is, replace, match, forEachObjIndexed, test
} = require('ramda')

const regex = require('./getVariableSyntax')()

module.exports = (inputs) => {
  const dependencies = []

  const iterate = (value) => {
    if (is(Object, value) || is(Array, value)) {
      return forEachObjIndexed(iterate, value)
    }
    if (is(String, value) && test(regex, value)) {
      const referencedVariable = replace(/[${}]/g, '', match(regex, value)[0]).split('.')
      if (referencedVariable[1] === 'outputs' || referencedVariable[1] === 'state') {
        dependencies.push(referencedVariable[0])
      }
    }
    return value
  }
  forEachObjIndexed(iterate, inputs)
  return dependencies
}
