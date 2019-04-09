const path = require('path')

function getLocalComponentsPaths(localComponents) {
  if (localComponents.length) {
    return localComponents.reduce(
      (accum, component) => ({
        [component]: path.resolve(component)
      }),
      {}
    )
  }
  return {}
}

module.exports = getLocalComponentsPaths
