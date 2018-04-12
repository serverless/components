const { isEmpty, map } = require('ramda')
const executeComponent = require('../components/executeComponent')

const execute = async (
  graph,
  components,
  stateFile,
  archive,
  command,
  options,
  rollback = false
) => {
  const leaves = graph.sinks()

  if (isEmpty(leaves)) {
    return graph
  }

  const executions = map(async (componentId) => {
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
    if (global.signalEventHandling && global.signalEventHandling.shouldExitGracefully) {
      throw new Error('Operation gracefully exited. State successfully persisted...')
    }
    return componentId
  }, leaves)

  // allow all executions to complete without terminating
  const suppressErrors = (p) => p.catch(() => {})
  await Promise.all(map(suppressErrors, executions))

  // if any executions failed, throw the error
  await Promise.all(executions)

  return execute(graph, components, stateFile, archive, command, options, rollback)
}

module.exports = execute
