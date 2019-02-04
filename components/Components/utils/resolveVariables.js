const { forEach, reduce, uniq } = require('../../../src/utils')

function getMatches(string) {
  const variablesRegex = /\${([\w\d.]+)}/g

  let matches = string.match(variablesRegex)
  if (matches) {
    matches = uniq(matches)
  }
  return matches
}

function resolveVariables(content) {
  let stringified = JSON.stringify(content)
  let matches = getMatches(stringified)

  while (matches) {
    // eslint-disable-next-line
    forEach((match) => {
      match = match.slice(2, -1) // remove `${` and `}` from matches to get the variables value
      const parts = match.split('.')
      const resolvedValue = reduce((accum, key) => accum[key], content, parts)
      const variableRegex = new RegExp('\\${' + match + '}', 'g')
      stringified = stringified.replace(variableRegex, resolvedValue)
    }, matches)
    matches = getMatches(stringified)
  }

  return JSON.parse(stringified)
}

module.exports = resolveVariables
