const { is, isEmpty } = require('ramda')
const generateContext = require('./generateContext')
const validateTypes = require('./validateTypes')
const resolvePostExecutionVars = require('../variables/resolvePostExecutionVars')
const { getInputs, getState, getOutputs } = require('../state')

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
    component.inputs = getInputs(stateFile, componentId)
  }

  const context = generateContext(components, component, stateFile, archive, options, command)

  if (command === 'remove') {
    if (isEmpty(context.state)) {
      return component
    }
  }

  const func = component.fns[command]
  let retainState = false
  if (is(Function, func)) {
    try {
      await func(component.inputs, context)
    } catch (e) {
      if (command === 'remove' && e.code === 'RETAIN_STATE') {
        retainState = true
      } else {
        throw e
      }
    }
    component.executed = true
  }
  component.state = getState(stateFile, component.id)
  component.outputs = getOutputs(stateFile, component.id)
  validateTypes(component.id, component.outputTypes, component.outputs, { prefix: 'Output' })

  component.promise.resolve(component)

  if (command === 'remove' && !retainState) {
    stateFile[componentId] = {
      type: component.type,
      state: {}
    }
  }

  return component
}

module.exports = executeComponent
