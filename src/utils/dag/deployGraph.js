import { all, get, isEmpty, map } from '@serverless/utils'
import resolveComponentVariables from '../component/resolveComponentVariables'
import cloneGraph from './cloneGraph'
import detectCircularDeps from './detectCircularDeps'

const deployNode = async (node, context) => {
  context.debug(
    `checking node - operation: ${node.operation} instanceId: ${
      node.instanceId
    } nextInstance: ${get('nextInstance.name', node)} prevInstance: ${get(
      'prevInstance.name',
      node
    )}`
  )
  if (['deploy', 'replace'].includes(node.operation)) {
    context.debug(`deploying node: ${node.nextInstance.name} { instanceId: ${node.instanceId} }`)
    if (node.nextInstance.name === undefined) {
      context.debug(`This instance has an undefined name`)
      context.debug(node.nextInstance)
    }
    const nextInstance = resolveComponentVariables(node.nextInstance)
    const prevInstance = !isEmpty(node.prevInstance)
      ? resolveComponentVariables(node.prevInstance)
      : node.prevInstance
    await nextInstance.deploy(prevInstance, context)
    context.debug(`node complete: ${node.nextInstance.name} { instanceId: ${node.instanceId} }`)
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
  context.debug('checking leaves:', leaves)
  if (isEmpty(leaves)) {
    context.debug('leaves empty:', leaves)
    if (graph.nodeCount() > 0) {
      detectCircularDeps(graph)
      throw new Error('Graph deployment did not complete')
    }
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
