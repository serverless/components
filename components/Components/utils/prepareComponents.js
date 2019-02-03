const { assoc, reduce, addIndex } = require('../../../src/utils')
const loadComponent = require('./loadComponent')

const reduceIndexed = addIndex(reduce)

// TODO: update this since it's just a hack to mute the child component completely
// and will drift when `getCli` is updated
function mockCli() {
  return {
    log: () => {},
    status: () => {},
    success: () => {},
    fail: () => {},
    log: () => {},
    output: () => {}
  }
}

function prepareComponents(components) {
  return reduceIndexed(
    (accum, value, key, idx) => {
      // figure out the Component class and instance names
      const splittedKey = key.split('::')
      const componentName = splittedKey[0] || key
      const instanceName = splittedKey[1] || `${componentName.toLowerCase()}${idx}`
      // load the component class
      const Component = loadComponent(componentName)
      const instance = new Component(instanceName, mockCli())
      const inputs = value
      return assoc(
        instanceName,
        {
          component: componentName,
          instance,
          inputs
        },
        accum
      )
    },
    {},
    components
  )
}

module.exports = prepareComponents
