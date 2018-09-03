const { relative } = require('path')
const { prop, keys, reduce } = require('ramda')
const getComponent = require('./getComponent')
const getInstanceId = require('./getInstanceId')
const getChildrenPromises = require('./getChildrenPromises')
const getComponentFunctions = require('./getComponentFunctions')
const getComponentRootPath = require('./getComponentRootPath')
const log = require('../logging/log')
const getServiceId = require('../state/getServiceId')
const getState = require('../state/getState')
const getOutputs = require('../state/getOutputs')

const generateContext = (
  components,
  component,
  stateFile,
  archive,
  options,
  command,
  internallyManaged = false
) => {
  const { id, type, rootPath } = component
  const { projectPath } = options
  const serviceId = getServiceId(stateFile)
  const instanceId = getInstanceId(stateFile, id)
  const inputs = prop('inputs', component)
  const context = {
    id,
    serviceId,
    instanceId,
    type,
    archive: getState(archive, id),
    state: getState(stateFile, id),
    outputs: getOutputs(stateFile, id),
    children: getChildrenPromises(component, components),
    rootPath,
    projectPath,
    command,
    options,
    log,
    // eslint-disable-next-line no-shadow
    load: async (type, alias, inputs) => {
      const childComponentRootPath = await getComponentRootPath(type)
      const childComponentId = `${id}:${alias}`

      const childComponent = await getComponent(
        childComponentRootPath,
        childComponentId,
        inputs,
        stateFile
      )
      childComponent.fns = getComponentFunctions(childComponentRootPath)
      childComponent.rootPath = childComponentRootPath

      const childComponentContext = generateContext(
        components,
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
            await childComponentFn(inputs, childComponentContext)
            return childComponentContext.outputs
          }
          return accum
        },
        {},
        keys(prop('fns', childComponent))
      )

      return modifiedComponent
    },
    saveState(state = {}) {
      const relativeRootPath = relative(process.cwd(), rootPath)
      // NOTE: set default values if information about component in stateFile is not yet present
      if (!stateFile[this.id]) {
        stateFile[this.id] = {
          type,
          instanceId,
          internallyManaged,
          rootPath: relativeRootPath,
          inputs,
          state: {},
          outputs: {}
        }
      }
      // NOTE: this needs to be kept in sync with the prop definitions aboves
      stateFile[this.id].type = type
      stateFile[this.id].instanceId = instanceId
      stateFile[this.id].internallyManaged = internallyManaged
      stateFile[this.id].rootPath = relativeRootPath
      stateFile[this.id].inputs = inputs
      stateFile[this.id].state = state
      stateFile[this.id].outputs = this.outputs
      this.state = state
    },
    setOutputs(outputs = {}) {
      const relativeRootPath = relative(process.cwd(), rootPath)
      // NOTE: set default values if information about component in stateFile is not yet present
      if (!stateFile[this.id]) {
        stateFile[this.id] = {
          type,
          instanceId,
          internallyManaged,
          rootPath: relativeRootPath,
          inputs,
          state: {},
          outputs: {}
        }
      }
      // NOTE: this needs to be kept in sync with the prop definitions aboves
      stateFile[this.id].type = type
      stateFile[this.id].instanceId = instanceId
      stateFile[this.id].internallyManaged = internallyManaged
      stateFile[this.id].rootPath = relativeRootPath
      stateFile[this.id].inputs = inputs
      stateFile[this.id].state = this.state
      stateFile[this.id].outputs = outputs
      this.outputs = outputs
    }
  }
  return context
}

module.exports = generateContext
