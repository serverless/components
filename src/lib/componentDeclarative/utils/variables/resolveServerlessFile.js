const { reduce } = require('../../../../utils')

function resolveServerlessFile(serverlessFileContent, variableObjects) {
  const stringified = JSON.stringify(serverlessFileContent)

  const resolved = reduce(
    (accum, obj) => {
      const { variable, value } = obj
      return accum.replace(new RegExp('\\${' + variable.slice(2, -1) + '}', 'g'), value)
    },
    stringified,
    variableObjects
  )

  return JSON.parse(resolved)
}

module.exports = resolveServerlessFile
