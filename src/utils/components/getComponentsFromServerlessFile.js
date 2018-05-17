const { deferredPromise } = require('@serverless/utils')
const { assoc, keys, mergeAll, map } = require('ramda')
const getChildrenIds = require('./getChildrenIds')
const getComponent = require('./getComponent')
const getComponentFunctions = require('./getComponentFunctions')
const getComponentRootPath = require('./getComponentRootPath')
const getDependencies = require('../variables/getDependencies')
const getState = require('../state/getState')

const getComponentsFromServerlessFile = async (
  stateFile,
  componentRoot,
  inputs = {},
  componentId
) => {
  const component = await getComponent(componentRoot, componentId, inputs, stateFile)

  const nestedComponents = mergeAll(
    await Promise.all(
      map(async (componentAlias) => {
        const nestedComponentRoot = await getComponentRootPath(
          component.components[componentAlias].type
        )
        const nestedComponentInputs = component.components[componentAlias].inputs || {}
        const nestedComponentId = component.components[componentAlias].id
        return getComponentsFromServerlessFile(
          stateFile,
          nestedComponentRoot,
          nestedComponentInputs,
          nestedComponentId
        )
      }, keys(component.components) || [])
    )
  )

  return assoc(
    component.id,
    {
      id: component.id,
      type: component.type,
      inputs: component.inputs,
      inputTypes: component.inputTypes,
      outputs: {},
      outputTypes: component.outputTypes,
      rootPath: componentRoot,
      state: getState(stateFile, component.id),
      dependencies: getDependencies(component.inputs),
      children: getChildrenIds(component) || {},
      promise: deferredPromise(),
      fns: getComponentFunctions(componentRoot)
    },
    nestedComponents
  )
}

module.exports = getComponentsFromServerlessFile
