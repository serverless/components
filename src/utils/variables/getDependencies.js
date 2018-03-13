const {
  is, replace, match, forEachObjIndexed
} = require('ramda')

const regex = require('./getVariableSyntax')()

module.exports = (inputs) => {
  const dependencies = []

  const iterate = (value) => {
    if (is(Object, value) || is(Array, value)) {
      return forEachObjIndexed(iterate, value)
    }
    if (is(String, value)) {
      match(regex, value).forEach((reference) => {
        const referencedVariable = replace(/[${}]/g, '', reference).split('.')
        if (referencedVariable[0] !== 'input' && referencedVariable[0] !== 'env') {
          dependencies.push(referencedVariable[0])
        }
      })
    }
    return value
  }
  forEachObjIndexed(iterate, inputs)
  return dependencies
}
