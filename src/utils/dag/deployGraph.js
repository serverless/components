import { all, contains, get, isEmpty, map } from '@serverless/utils'
import resolveComponentEvaluables from '../component/resolveComponentEvaluables'
import cloneGraph from './cloneGraph'
import detectCircularDeps from './detectCircularDeps'

const validateNode = (node, context) => {
  const { nextInstance, prevInstance, instanceId, operation } = node
  if (contains(operation, ['deploy', 'replace'])) {
    if (!nextInstance) {
      throw new Error(`deployGraph expected nextInstance to be defined for ${operation} operation`)
    }
    if (!instanceId) {
      throw new Error(`deployGraph expected instanceId to be defined for ${operation} operation`)
    }
    if (nextInstance.name === undefined) {
      context.debug(`This instance has an undefined name`)
      context.debug(nextInstance)
    }
    if (operation === 'replace' && !prevInstance) {
      throw new Error(`deployGraph expected nextInstance to be defined for ${operation} operation`)
    }
  }
}

const deployNode = async (node, context) => {
  // NOTE BRN: Start by resolving all evaluables on this node. This will enable us to run deploy and shouldDeploy without having to manually resolve evaluables in the method.
  const { prevInstance, instanceId } = node
  let { nextInstance } = node
  if (!isEmpty(nextInstance)) {
    nextInstance = resolveComponentEvaluables(nextInstance)
  }

  // NOTE BRN: This only makes sense if we end up persisting variables into state
  // if (!isEmpty(prevInstance)) {
  //   resolveComponentEvaluables(prevInstance)
  // }

  // NOTE BRN: We wait till the last minute to run should deploy so that
  // 1. evaluables are resolved
  // 2. all values within evaluables that this node depends on have had a chance to update during their deploy step.
  if (!node.operation) {
    node.operation = await nextInstance.shouldDeploy(prevInstance, context)
  }

  context.debug(
    `checked if node should be deployed - result operation: ${node.operation} instanceId: ${
      node.instanceId
    } nextInstance: ${get('nextInstance.name', node)} prevInstance: ${get(
      'prevInstance.name',
      node
    )}`
  )

  validateNode(node, context)
  if (node.operation === 'deploy') {
    context.debug(`deploying node: ${nextInstance.name} { instanceId: ${instanceId} }`)
    await nextInstance.deploy(prevInstance, context)
    context.debug(`node deployment complete: ${nextInstance.name} { instanceId: ${instanceId} }`)
    // TODO BRN: We should probably save state incrementally as we deploy each node
  } else if (node.operation === 'replace') {
    context.debug(`deploying node: ${nextInstance.name} { instanceId: ${instanceId} }`)

    // NOTE BRN: We do not pass the prevInstance on a replacement because it should be the same as deploying a new node
    await nextInstance.deploy(null, context)
    context.debug(`node deployment complete: ${nextInstance.name} { instanceId: ${instanceId} }`)
    // TODO BRN: We should probably save state incrementally as we deploy each node
  }
}

const deployNodeIds = async (nodeIds, graph, context) =>
  all(
    map(async (nodeId) => {
      const node = graph.node(nodeId)
      if (!node) {
        throw new Error(`could not find node for nodeId:${nodeId}`)
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
