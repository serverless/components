const { is, isNil, isEmpty } = require('ramda')
const generateContext = require('./generateContext')
const resolvePostExecutionVars = require('../variables/resolvePostExecutionVars')
const { getInputs, getState } = require('../state')

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
  if (is(Function, func)) {
    component.outputs = (await func(component.inputs, context)) || {}
    component.executed = true
  }
  component.state = getState(stateFile, component.id)

  component.promise.resolve(component)

  /* TODO: This logic is complex. It's meant to wipe out extra keys in the state
  file if a remove was successful, if either the removed component has no
  script, or else the script emptied the state during remove. This is required
  to prevent certain features from breaking (e.g. skip removed components when
  removing again) while also providing the ability for a component to
  selectively report that its removal is incomplete pending manual and needs to
  be run again. We need some deep architectural refactors to eliminate this
  kind of hackiness. There may be edge cases where this does not work, e.g.
  if the scripted component did not have any state keys to save in the first
  place, but for some reason still has complex removal logic. */
  if (
    command === 'remove' &&
    (!is(Function, func) || (isNil(component.state) || isEmpty(component.state)))
  ) {
    stateFile[componentId] = {
      type: component.type,
      state: {}
    }
  }

  return component
}

module.exports = executeComponent
