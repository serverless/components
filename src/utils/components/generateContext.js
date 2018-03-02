const path = require('path')
const { keys, reduce, mergeDeepRight } = require('ramda')
const getRegistryRoot = require('../getRegistryRoot')

const generateContext = (componentId, components, options) => {
  // console.log(components[componentId].state)
  const context = {
    componentId,
    state: components[componentId].state,
    options,
    log: (message) => {
      if (!process.env.CI) {
        process.stdin.write(`${message}\n`)
      }
    },
    load: (type, alias) => {
      const component = require(path.join(getRegistryRoot(), type)) // eslint-disable-line

      const childComponentId = `${componentId}:${alias}`
      components[childComponentId] = components[childComponentId] || {}
      const childComponentContext = generateContext(childComponentId, components, options)

      const fnNames = keys(component)

      const modifiedComponent = reduce((accum, fnName) => {
        const childComponentFn = component[fnName]
        accum[fnName] = async (inputs) => childComponentFn(inputs, childComponentContext)
        return accum
      }, {}, fnNames)

      return modifiedComponent
    },
    saveState: function (state = {}) {
      components[componentId].state = mergeDeepRight(components[componentId].state, state)
      this.state = components[componentId].state
    }
  }
  return context
}

module.exports = generateContext
