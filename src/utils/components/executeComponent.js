const { is, isEmpty } = require('ramda')
const generateContext = require('./generateContext')
const resolvePostExecutionVars = require('../variables/resolvePostExecutionVars')
const getInputs = require('../state/getInputs')

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
  const context = generateContext(components, component, stateFile, archive, options, command)
  component.inputs = resolvePostExecutionVars(component.inputs, components)

  if (rollback) {
    command = 'rollback'
    stateFile[componentId] = archive[componentId]
  } else if (command === 'remove') {
    component.inputs = getInputs(stateFile, componentId)
    if (isEmpty(context.state)) {
      return component
    }
  }

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
