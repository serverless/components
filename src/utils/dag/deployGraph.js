import { contains, get, isEmpty } from '@serverless/utils'
import resolveComponentEvaluables from '../component/resolveComponentEvaluables'
import execGraph from './execGraph'

const validateNode = (node, context) => {
  const { nextInstance, instanceId, operation } = node
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
    if (operation === 'replace' && !nextInstance) {
      throw new Error(`deployGraph expected nextInstance to be defined for ${operation} operation`)
    }
  }
}

const deployInstance = async (nextInstance, prevInstance, context) => {
  context.debug(
    `deploying component: ${nextInstance.name} { instanceId: ${nextInstance.instanceId} }`
  )

  // NOTE BRN: We do not pass the prevInstance on a replacement because it should be the same as deploying a new node
  await nextInstance.deploy(prevInstance, context)
  context.debug(
    `component deployment complete: ${nextInstance.name} { instanceId: ${nextInstance.instanceId} }`
  )
  // TODO BRN: We should probably save state incrementally as we deploy each node
}

const deployNode = async (node, context) => {
  // NOTE BRN: Start by resolving all evaluables on this node. This will enable us to run deploy and shouldDeploy without having to manually resolve evaluables in the method.
  let { nextInstance, prevInstance } = node
  if (!isEmpty(prevInstance)) {
    prevInstance = resolveComponentEvaluables(prevInstance)
  }
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
    `checked if component should be deployed - result operation: ${node.operation} instanceId: ${
      node.instanceId
    } nextInstance: ${get('nextInstance.name', node)} prevInstance: ${get(
      'prevInstance.name',
      node
    )}`
  )

  validateNode(node, context)
  if (node.operation === 'deploy') {
    await deployInstance(nextInstance, prevInstance, context)
  } else if (node.operation === 'replace') {
    await deployInstance(nextInstance, null, context)
  }
}

const nextNodeIds = (graph) => graph.sinks()

const deployGraph = async (graph, context) =>
  execGraph(
    {
      iteratee: deployNode,
      next: nextNodeIds
    },
    graph,
    context
  )

export default deployGraph
