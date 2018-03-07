const BbPromise = require('bluebird')
const { isEmpty, map } = require('ramda')
const executeComponent = require('../components/executeComponent')

const execute = async (graph, components, stateFile, command, options) => {
  const leaves = graph.sinks()

  if (isEmpty(leaves)) {
    return graph
  }
  await BbPromise.all(map(
    async (componentId) => {
      await executeComponent(componentId, components, stateFile, command, options)
      graph.removeNode(componentId)
    }
    , leaves
  ))
  return execute(graph, components, stateFile, command, options)
}

module.exports = execute
