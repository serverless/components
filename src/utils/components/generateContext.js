const path = require('path')
const { keys, reduce } = require('ramda')
const getRegistryRoot = require('../getRegistryRoot')

const generateContext = (componentId, components, options) => {
  const context = {
    id: componentId,
    state: components[componentId].state || {},
    options,
    log: (message) => {
      if (!process.env.CI) {
        process.stdin.write(`${message}\n`)
      }
    },
    load: async (type, alias) => {
      const component = require(path.join(getRegistryRoot(), type)) // eslint-disable-line

      const childComponentId = `${componentId}:${alias}`
      components[childComponentId] = components[childComponentId] || { id: childComponentId }
      const childComponentContext = generateContext(childComponentId, components, options)

      const fnNames = keys(component)

      const modifiedComponent = reduce((accum, fnName) => {
        const childComponentFn = component[fnName]
        accum[fnName] = async (inputs) => childComponentFn(inputs, childComponentContext)
        return accum
      }, {}, fnNames)

      return modifiedComponent
    },
    saveState: function (state = {}) { // eslint-disable-line
      components[this.id].state = state
      this.state = components[this.id].state
    }
  }
  return context
}

module.exports = generateContext
