const path = require('path')
const { prop, keys, reduce } = require('ramda')
const getComponent = require('./getComponent')
const getInstanceId = require('./getInstanceId')
const getRegistryRoot = require('../getRegistryRoot')
const getServiceId = require('../state/getServiceId')
const getState = require('../state/getState')
const fileExists = require('../fs/fileExists')
const log = require('../log')

const generateContext = (
  component,
  stateFile,
  archive,
  options,
  command,
  internallyManaged = false
) => {
  const { id, type } = component
  const serviceId = getServiceId(stateFile)
  const instanceId = getInstanceId(stateFile, id)
  const context = {
    id,
    serviceId,
    instanceId,
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

      const childComponent = await getComponent(
        childComponentRootPath,
        childComponentId,
        inputs,
        stateFile
      )
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
        command,
        true
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
          instanceId,
          internallyManaged,
          state: {}
        }
      }
      // NOTE: this needs to be kept in sync with the prop definitions aboves
      stateFile[this.id].type = type
      stateFile[this.id].instanceId = instanceId
      stateFile[this.id].internallyManaged = internallyManaged
      stateFile[this.id].state = state
      this.state = state
    }
  }
  return context
}

module.exports = generateContext
