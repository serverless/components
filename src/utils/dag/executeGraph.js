const BbPromise = require('bluebird')
const { isEmpty, map } = require('ramda')
const executeComponent = require('../components/executeComponent')

const execute = async (graph, components, stateFile,
  archive, command, options, rollback = false) => {
  const leaves = graph.sinks()

  if (isEmpty(leaves)) {
    return graph
  }

  // using Bluebird promises here so that we can skip failures and inspect them
  // later on when executing the graph in parallel and therefore save state in a
  // consistent way
  const ensuredExecutions = await BbPromise.map(leaves, async (componentId) => {
    try {
      const node = graph.node(componentId)
      await executeComponent(
        componentId,
        components,
        stateFile,
        archive,
        node.command,
        options,
        rollback
      )
      graph.removeNode(componentId)
      return BbPromise.resolve(componentId).reflect()
    } catch (error) {
      return BbPromise.reject(error).reflect()
    }
  })
  // check if something went wrong while exeucting in parallel
  // re-throw the captured rejection (if any)
  map((promiseInspection) => {
    if (promiseInspection.isRejected()) {
      throw new Error(promiseInspection.reason())
    }
  }, ensuredExecutions)

  return execute(graph, components, stateFile, archive, command, options, rollback)
}

module.exports = execute
