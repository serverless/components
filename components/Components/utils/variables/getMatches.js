const traverse = require('traverse')
const { union } = require('../../../../src/utils')
const regex = require('./regex')

function getMatches(serverlessFileContent) {
  const { components } = serverlessFileContent

  return traverse(components).reduce(function(accum, value) {
    const matching = typeof value === 'string' ? value.match(regex) : null
    if (matching) {
      // TODO: throw error with a nicer error message the instanceId is missing
      const component = this.path[0].split('::')[0]
      const instanceId = this.path[0].split('::')[1]
      const path = this.path.slice(1)
      const match = matching[0]

      const matchObj = {
        component,
        instanceId,
        path,
        match
      }

      return union([matchObj], accum)
    }
    return accum
  }, [])
}

module.exports = getMatches
