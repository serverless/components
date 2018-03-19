const BbPromise = require('bluebird')
const { isEmpty, map } = require('ramda')
const executeComponent = require('../components/executeComponent')

const execute = async (graph, components, stateFile, options) => {
  const leaves = graph.sinks()

  if (isEmpty(leaves)) {
    return graph
  }
  await BbPromise.all(map(
    async (componentId) => {
      const node = graph.node(componentId)
      await executeComponent(componentId, components, stateFile, node.command, options)
      graph.removeNode(componentId)
    }
    , leaves
  ))
  return execute(graph, components, stateFile, options)
}

module.exports = execute
