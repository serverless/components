const generateContext = require('./generateContext')
const resolvePostExecutionVars = require('../variables/resolvePostExecutionVars')

module.exports = async (componentId, components, stateFile, archive,
  command, options, rollback = false) => {
  const component = components[componentId]
  component.inputs = resolvePostExecutionVars(component.inputs, components)
  const context = generateContext(component, stateFile, archive, options, command)
  if (rollback && typeof component.fns.rollback === 'function') {
    component.outputs = (await component.fns.rollback(component.inputs, context)) || {}
    stateFile[componentId] = archive[componentId]
  } else if (typeof component.fns[command] === 'function') {
    component.outputs = (await component.fns[command](component.inputs, context)) || {}
  }
  if (command === 'remove') {
    stateFile[componentId] = {
      type: component.type,
      state: {}
    }
  }
  component.executed = true
}
