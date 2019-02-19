const { filter, reduce, assocPath, lensPath, view } = require('../../../../utils')
const types = require('./types')

function resolveComponentVariables(variables, results, instance) {
  const { instanceId, inputs } = instance
  const variablesToResolve = filter((object) => {
    return object.instanceId === instanceId && object.type === types.component
  }, variables)

  return reduce(
    (accum, object) => {
      const { path, value } = object
      const pathToResult = value.split('.')
      return assocPath(path, view(lensPath(pathToResult), results), accum)
    },
    inputs,
    variablesToResolve
  )
}

module.exports = resolveComponentVariables
