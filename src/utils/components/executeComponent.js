module.exports = async (component, command, context) => {
  if (typeof component.fns[command] === 'function') {
    component.outputs = (await component.fns[command](component.inputs, context)) || {}
  }
  if (command === 'remove') component.state = {}
}
