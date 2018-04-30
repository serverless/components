const { deferredPromise } = require('@serverless/utils')
const { assoc, keys, mergeAll, mergeDeepLeft, map, intersection, isEmpty } = require('ramda')
const getChildrenIds = require('./getChildrenIds')
const getComponent = require('./getComponent')
const getComponentFunctions = require('./getComponentFunctions')
const getComponentRootPath = require('./getComponentRootPath')
const getDependencies = require('../variables/getDependencies')
const getState = require('../state/getState')

const getComponentsFromServerlessFile = async (
  stateFile,
  componentRoot = process.cwd(),
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

  const functions = getComponentFunctions(componentRoot)

  let commands = {}

  // Throw on duplicate command keys
  if (component.commands && functions.commands && typeof functions.commands === 'object') {
    const conflictingKeys = intersection(Object.keys(functions.commands), Object.keys(component.commands)) // eslint-disable-line
    if (!isEmpty(conflictingKeys)) {
      throw new Error(`Command ${JSON.stringify(conflictingKeys)} exported from yaml AND code in ${
        component.id
      }.
      You must resolve the naming conflict`)
    }
  }

  // Add exported commands from index.js of component
  if (functions.commands && typeof functions.commands === 'object') {
    commands = mergeDeepLeft(commands, functions.commands)
    // delete functions.commands
  }
  // Add commands defined in component serverless.yml
  if (component.commands) {
    commands = mergeDeepLeft(commands, component.commands)
  }

  return assoc(
    component.id,
    {
      id: component.id,
      type: component.type,
      inputs: component.inputs,
      inputTypes: component.inputTypes,
      commands: commands,
      outputs: {},
      outputTypes: component.outputTypes,
      rootPath: componentRoot,
      state: getState(stateFile, component.id),
      dependencies: getDependencies(component.inputs),
      children: getChildrenIds(component) || {},
      promise: deferredPromise(),
      fns: functions
    },
    nestedComponents
  )
}

module.exports = getComponentsFromServerlessFile
