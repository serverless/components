const { is } = require('ramda')
const generateContext = require('./generateContext')
const resolvePostExecutionVars = require('../variables/resolvePostExecutionVars')
const getState = require('../state/getState')

const executeComponent = async (
  componentId,
  components,
  stateFile,
  archive,
  command,
  options,
  rollback = false
) => {
  const component = components[componentId]
  component.inputs = resolvePostExecutionVars(component.inputs, components)

  if (rollback) {
    command = 'rollback'
    stateFile[componentId] = archive[componentId]
  } else if (command === 'remove') {
    const state = getState(stateFile, componentId)
    component.inputs = state
  }

  const context = generateContext(components, component, stateFile, archive, options, command)
  const func = component.fns[command]
  if (is(Function, func)) {
    component.outputs = (await func(component.inputs, context)) || {}
    component.executed = true
  }

  component.promise.resolve(component)

  if (command === 'remove') {
    stateFile[componentId] = {
      type: component.type,
      state: {}
    }
  }

  return component
}

module.exports = executeComponent
