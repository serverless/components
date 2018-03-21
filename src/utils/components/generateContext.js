const path = require('path')
const { prop, keys, reduce } = require('ramda')
const getComponent = require('./getComponent')
const getRegistryRoot = require('../getRegistryRoot')
const getState = require('../state/getState')
const fileExists = require('../fs/fileExists')
const log = require('../log')

const generateContext = (component, stateFile, archive, options, command) => {
  const { id, type } = component
  const context = {
    id,
    type,
    archive: getState(archive, id),
    state: getState(stateFile, id),
    command,
    options,
    log,
    // eslint-disable-next-line no-shadow
    load: async (type, alias, inputs) => {
      const childComponentRootPath = path.join(getRegistryRoot(), type)
      const childComponentId = `${id}:${alias}`

      const childComponent = await getComponent(childComponentRootPath, childComponentId, inputs)
      // TODO: update the following once getComponent adds the properties automatically
      let fns = {}
      if (await fileExists(path.join(childComponentRootPath, 'index.js'))) {
        fns = require(path.join(childComponentRootPath, 'index.js')) // eslint-disable-line
      }
      childComponent.fns = fns

      const childComponentContext = generateContext(
        childComponent,
        stateFile,
        archive,
        options,
        command
      )

      // NOTE: this only returns an object containing the component functions
      const modifiedComponent = reduce(
        (accum, fnName) => {
          const childComponentFn = childComponent.fns[fnName]
          // eslint-disable-next-line no-shadow
          accum[fnName] = async (fnInputs) => {
            inputs = fnInputs || prop('inputs', childComponent)
            return childComponentFn(inputs, childComponentContext)
          }
          return accum
        },
        {},
        keys(prop('fns', childComponent))
      )

      return modifiedComponent
    },
    saveState(state = {}) {
      // NOTE: set default values if information about component in stateFile is not yet present
      if (!stateFile[this.id]) {
        stateFile[this.id] = {
          type,
          state: {}
        }
      }
      stateFile[this.id].state = state
      stateFile[this.id].type = type
      this.state = state
    }
  }
  return context
}

module.exports = generateContext
