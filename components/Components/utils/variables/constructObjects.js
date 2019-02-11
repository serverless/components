const { map } = require('../../../../src/utils')
const getMatches = require('./getMatches')
const regex = require('./regex')
const types = require('./types')
const resolveSimpleVariable = require('./resolveSimpleVariable')

function constructObjects(serverlessFileContent) {
  const matches = getMatches(serverlessFileContent)

  return map((matchObj) => {
    let type
    let value
    const { component, instanceId, path, match } = matchObj
    const variable = match

    const splitted = variable.split(':')
    if (!splitted[1]) {
      // the "simple" type is a variable which is resolvable solely with
      // information in `serverelss.yml`
      type = 'simple'
      value = resolveSimpleVariable(serverlessFileContent, variable)
    } else {
      // remove `${` and `}` via slicing
      type = splitted[0].slice(2)
      value = splitted[1].slice(0, -1)
      if (!Object.values(types).includes(type)) {
        throw new Error(`Unsupported Serverless Variables type "${type}"`)
      }
    }

    return {
      regex,
      component,
      instanceId,
      variable,
      path,
      type,
      value
    }
  }, matches)
}

module.exports = constructObjects
