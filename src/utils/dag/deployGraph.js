import { all, isEmpty, map } from '@serverless/utils'
import { Graph } from 'graphlib'
import resolveVariables from '../variable/resolveVariables'
import cloneGraph from './cloneGraph'

const deployNode = async (node, context) => {
  const nextInstance = resolveVariables(node.nextInstance)
  const prevInstance = resolveVariables(node.prevInstance)
  if (['deploy', 'replace'].includes(node.operation)) {
    await nextInstance.deploy(prevInstance, context)
  }
}

const deployNodeIds = async (nodeIds, graph, context) =>
  all(
    map(async (nodeId) => {
      const node = graph.node(nodeId)
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
