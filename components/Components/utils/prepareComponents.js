const { assoc, reduce, addIndex } = require('../../../src/utils')

const reduceIndexed = addIndex(reduce)

function prepareComponents(components, that) {
  const keys = Object.keys(components)
  return reduceIndexed(
    // TODO: remove auto-aliasing support
    (accum, key, idx) => {
      // figure out the Component class and instance names
      const splittedKey = key.split('::')
      const componentName = splittedKey[0] || key
      const instanceId = splittedKey[1] || `${componentName.toLowerCase()}${idx}`
      // load the component class
      const instance = that.load(componentName, instanceId)
      const inputs = components[key] || {} // Don't let inputs be null
      return assoc(
        instanceId,
        {
          instanceId,
          component: componentName,
          instance,
          inputs
        },
        accum
      )
    },
    {},
    keys
  )
}

module.exports = prepareComponents
