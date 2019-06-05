const path = require('path')

function getLocalComponentsPaths(localComponents) {
  if (localComponents.length) {
    return localComponents.reduce(
      (accum, component) => Object.assign(accum, { [component]: path.resolve(component) }),
      {}
    )
  }
  return {}
}

module.exports = getLocalComponentsPaths
