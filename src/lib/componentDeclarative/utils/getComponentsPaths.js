const getLocalComponentsPaths = require('./getLocalComponentsPaths')
const getRegistryComponentsPaths = require('./getRegistryComponentsPaths')

async function getComponentsPaths(componentNames) {
  const { registryComponents, localComponents } = componentNames.reduce(
    (accum, name) => {
      if (name.startsWith('.')) {
        accum.localComponents.push(name)
      } else {
        accum.registryComponents.push(name)
      }
      return accum
    },
    { registryComponents: [], localComponents: [] }
  )

  const registryPaths = await getRegistryComponentsPaths(registryComponents)
  const localPaths = getLocalComponentsPaths(localComponents)

  return {
    ...registryPaths,
    ...localPaths
  }
}

module.exports = getComponentsPaths
