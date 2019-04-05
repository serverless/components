const traverse = require('traverse')
const { union } = require('../../../../utils')
const regex = require('./regex')

function getMatches(serverlessFileContent) {
  return traverse(serverlessFileContent).reduce(function(accum, value) {
    const matching = typeof value === 'string' ? value.match(regex) : null
    if (matching) {
      // TODO: throw error with a nicer error message the instanceId is missing
      const instanceId = this.path[0]
      const { component } = serverlessFileContent[instanceId]
      const path = this.path.slice(2)
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
