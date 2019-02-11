const { reduce } = require('../../../../src/utils')

function resolveSimpleVariable(serverlessFileContent, variable) {
  // remove `${` and `}` from matches to get the variables value
  const parts = variable.slice(2, -1).split('.')
  // TODO: add support for deeply nested / recursive values
  return reduce((accum, key) => accum[key], serverlessFileContent, parts)
}

module.exports = resolveSimpleVariable
