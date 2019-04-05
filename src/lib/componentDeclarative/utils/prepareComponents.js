const installComponents = require('./installComponents')
const { assoc, reduce } = require('../../../utils')

async function prepareComponents(components, that) {
  const instanceIds = Object.keys(components)

  const componentNames = instanceIds.map((instanceId) => components[instanceId].component)

  const componentsPaths = await installComponents(componentNames)
  return reduce(
    // TODO: remove auto-aliasing support
    async (accum, instanceId) => {
      const componentObj = components[instanceId]
      // figure out the Component class and instance names
      const componentName = componentObj.component
      const inputs = componentObj.inputs || {} // Don't let inputs be null
      // load the component class
      const instance = await that.load(componentsPaths[componentName], instanceId)
      return assoc(
        instanceId,
        {
          instanceId,
          component: componentName,
          instance,
          inputs
        },
        await accum
      )
    },
    {},
    instanceIds
  )
}

module.exports = prepareComponents
