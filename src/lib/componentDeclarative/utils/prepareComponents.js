const { assoc, reduce, addIndex } = require('../../../utils')

const reduceIndexed = addIndex(reduce)

async function prepareComponents(components, that) {
  const keys = Object.keys(components)
  return reduceIndexed(
    // TODO: remove auto-aliasing support
    async (accum, key, idx) => {
      const component = components[key]
      // figure out the Component class and instance names
      const splittedKey = key.split('::')
      const componentName = splittedKey[0] || key
      const instanceId = splittedKey[1] || `${componentName.toLowerCase()}${idx}`
      const inputs = component || {} // Don't let inputs be null
      // load the component class
      const instance = await that.load(componentName, instanceId)
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
    keys
  )
}

module.exports = prepareComponents
