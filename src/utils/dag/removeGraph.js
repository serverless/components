import { all, get, isEmpty, map } from '@serverless/utils'
import resolveComponentEvaluables from '../component/resolveComponentEvaluables'
import cloneGraph from './cloneGraph'

const removeNode = async (node, context) => {
  context.debug(
    `checking node for removal - operation: ${node.operation} instanceId: ${
      node.instanceId
    } nextInstance: ${get('nextInstance.name', node)} prevInstance: ${get(
      'prevInstance.name',
      node
    )}`
  )
  if (['remove', 'replace'].includes(node.operation)) {
    if (!node.prevInstance) {
      throw new Error('deployGraph expected prevInstance to be defined for deploy operation')
    }
    context.debug(`removing node: ${node.prevInstance.name} { instanceId: ${node.instanceId} }`)
    if (node.prevInstance.name === undefined) {
      context.debug(`This instance has an undefined name`)
      context.debug(node.prevInstance)
    }
    const prevInstance = resolveComponentEvaluables(node.prevInstance)
    await prevInstance.remove(context)
    context.debug(`node removal complete: ${prevInstance.name} { instanceId: ${node.instanceId} }`)
  }
}

const removeNodeIds = async (nodeIds, graph, context) =>
  all(
    map(async (nodeId) => {
      const node = graph.node(nodeId)
      await removeNode(node, context)
      graph.removeNode(nodeId)
    }, nodeIds)
  )

const removeLeaves = async (graph, context) => {
  const leaves = graph.sources()

  if (isEmpty(leaves)) {
    return graph
  }

  await removeNodeIds(leaves, graph, context)
  return removeLeaves(graph, context)
  //
  // // allow all executions to complete without terminating
  // const suppressErrors = (p) => p.catch(() => {})
  // await Promise.all(map(suppressErrors, executions))
  //
  // // if any executions failed, throw the error
  // await Promise.all(executions)
  //
  // return execute(graph, components, stateFile, archive, command, options, rollback)
}

const removeGraph = async (graph, context) => removeLeaves(cloneGraph(graph), context)

export default removeGraph
