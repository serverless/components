const generateContext = require('./generateContext')
const resolvePostExecutionVars = require('../variables/resolvePostExecutionVars')

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
  const context = generateContext(components, component, stateFile, archive, options, command)
  if (rollback && typeof component.fns.rollback === 'function') {
    component.outputs = (await component.fns.rollback(component.inputs, context)) || {}
    stateFile[componentId] = archive[componentId]
  } else if (!rollback && typeof component.fns[command] === 'function') {
    component.outputs = (await component.fns[command](component.inputs, context)) || {}
  }
  component.promise.resolve(component)
  component.executed = true
}

module.exports = executeComponent
