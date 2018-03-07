const path = require('path')
const { keys, reduce } = require('ramda')
const getRegistryRoot = require('../getRegistryRoot')

const generateContext = (componentId, stateFile, options) => {
  const context = {
    id: componentId,
    state: stateFile[componentId] || {},
    options,
    log: (message) => {
      if (!process.env.CI) {
        process.stdin.write(`${message}\n`)
      }
    },
    load: async (type, alias) => {
      const component = require(path.join(getRegistryRoot(), type)) // eslint-disable-line

      const childComponentId = `${componentId}:${alias}`
      const childComponentContext = generateContext(childComponentId, stateFile, options)

      const fnNames = keys(component)

      const modifiedComponent = reduce((accum, fnName) => {
        const childComponentFn = component[fnName]
        accum[fnName] = async (inputs) => childComponentFn(inputs, childComponentContext)
        return accum
      }, {}, fnNames)

      return modifiedComponent
    },
    saveState: function (state = {}) { // eslint-disable-line
      stateFile[this.id] = state
      this.state = state
    }
  }
  return context
}

module.exports = generateContext
