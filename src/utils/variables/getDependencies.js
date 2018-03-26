const {
  append, concat, is, match, reduce, replace, values
} = require('ramda')
const regex = require('./getVariableSyntax')()
const reservedNames = require('./reservedNames')

/**
 * @param { Object<string, *> } inputs
 * @returns { Array<string> }
 */
const getDependencies = (inputs) => {
  const vals = is(Object, inputs) ? values(inputs) : inputs
  return reduce((dependencies, value) => {
    if (is(Object, value) || is(Array, value)) {
      return concat(dependencies, getDependencies(value))
    }
    if (is(String, value)) {
      return reduce((deps, reference) => {
        const [ referencedVariable ] = replace(/[${}]/g, '', reference).split('.')
        if (!reservedNames.includes(referencedVariable)) {
          return append(referencedVariable, deps)
        }
        return deps
      }, dependencies, match(regex, value))
    }
    return value
  }, [], vals)
}

module.exports = getDependencies
