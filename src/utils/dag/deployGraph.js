import { all, isEmpty, map } from '@serverless/utils'
import resolveComponentVariables from '../component/resolveComponentVariables'
import cloneGraph from './cloneGraph'

const deployNode = async (node, context) => {
  if (['deploy', 'replace'].includes(node.operation)) {
    const nextInstance = resolveComponentVariables(node.nextInstance)
    const prevInstance = !isEmpty(node.prevInstance)
      ? resolveComponentVariables(node.prevInstance)
      : node.prevInstance
    await nextInstance.deploy(prevInstance, context)
  }
}

const deployNodeIds = async (nodeIds, graph, context) =>
  all(
    map(async (nodeId) => {
      const node = graph.node(nodeId)
      if (!node) {
        throw new Error('could not find node for nodeId:', nodeId)
      }
      await deployNode(node, context)
      graph.removeNode(nodeId)
    }, nodeIds)
  )

const deployLeaves = async (graph, context) => {
  const leaves = graph.sinks()
  if (isEmpty(leaves)) {
    return graph
  }

  await deployNodeIds(leaves, graph, context)
  return deployLeaves(graph, context)
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

const deployGraph = async (graph, context) => deployLeaves(cloneGraph(graph), context)

export default deployGraph
