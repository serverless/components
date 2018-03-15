const {
  is, replace, match, forEachObjIndexed
} = require('ramda')

const regex = require('./getVariableSyntax')()
const reservedNames = require('./reservedNames')

module.exports = (inputs) => {
  const dependencies = []

  const iterate = (value) => {
    if (is(Object, value) || is(Array, value)) {
      return forEachObjIndexed(iterate, value)
    }
    if (is(String, value)) {
      match(regex, value).forEach((reference) => {
        const referencedVariable = replace(/[${}]/g, '', reference).split('.')
        if (!reservedNames.includes(referencedVariable[0])) {
          dependencies.push(referencedVariable[0])
        }
      })
    }
    return value
  }
  forEachObjIndexed(iterate, inputs)
  return dependencies
}
