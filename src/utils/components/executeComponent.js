const generateContext = require('./generateContext')
const resolvePostExecutionVars = require('../variables/resolvePostExecutionVars')

module.exports = async (componentId, components, stateFile, command, options) => {
  const component = components[componentId]
  component.inputs = resolvePostExecutionVars(component.inputs, components)
  const context = generateContext(component, stateFile, options)
  if (typeof component.fns[command] === 'function') {
    component.outputs = (await component.fns[command](component.inputs, context)) || {}
  }
}
