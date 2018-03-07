const BbPromise = require('bluebird')
const { isEmpty, map } = require('ramda')
const executeComponent = require('../components/executeComponent')
const generateContext = require('../components/generateContext')
const resolvePostExecutionVars = require('../variables/resolvePostExecutionVars')

const execute = async (graph, components, stateFile, command, options) => {
  const leaves = graph.sinks()

  if (isEmpty(leaves)) {
    return graph
  }
  await BbPromise.all(map(
    async (componentId) => {
      const component = components[componentId]
      component.inputs = resolvePostExecutionVars(component.inputs, components)
      const context = generateContext(componentId, stateFile, options)
      await executeComponent(component, command, context)
      graph.removeNode(componentId)
    }
    , leaves
  ))
  return execute(graph, components, stateFile, command, options)
}

module.exports = execute
