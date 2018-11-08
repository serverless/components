import { contains, get, isEmpty } from '@serverless/utils'
import resolveComponentEvaluables from '../component/resolveComponentEvaluables'
import execGraph from './execGraph'

const validateNode = (node, context) => {
  const { nextInstance, prevInstance, instanceId, operation } = node
  if (contains(operation, ['remove', 'replace'])) {
    if (!prevInstance && !nextInstance) {
      throw new Error(`removeGraph expected prevInstance to be defined for ${operation} operation`)
    }
    if (!instanceId) {
      throw new Error(`removeGraph expected instanceId to be defined for ${operation} operation`)
    }
    if (nextInstance && nextInstance.name === undefined) {
      context.debug(`This instance has an undefined name`)
      context.debug(nextInstance)
    }

    if (prevInstance && prevInstance.name === undefined) {
      context.debug(`This instance has an undefined name`)
      context.debug(prevInstance)
    }
  }
}

const removeInstance = async (instance, context) => {
  context.debug(`removing component: ${instance.name} { instanceId: ${instance.instanceId} }`)
  await instance.remove(context)
  context.debug(
    `component removal complete: ${instance.name} { instanceId: ${instance.instanceId} }`
  )
}

const removeNode = async (node, context) => {
  const { instanceId, operation } = node
  let { nextInstance, prevInstance } = node
  if (!isEmpty(nextInstance)) {
    nextInstance = resolveComponentEvaluables(nextInstance)
  }
  if (!isEmpty(prevInstance)) {
    prevInstance = resolveComponentEvaluables(prevInstance)
  }
  context.debug(
    `checking if component should be removed - operation: ${operation} instanceId: ${instanceId} nextInstance: ${get(
      'name',
      nextInstance
    )} prevInstance: ${get('name', prevInstance)}`
  )
  validateNode(node, context)
  if (contains(operation, ['remove', 'replace'])) {
    if (operation === 'replace') {
      if (prevInstance) {
        await removeInstance(prevInstance, context)
      }
    } else if (operation === 'remove') {
      if (prevInstance) {
        await removeInstance(prevInstance, context)
      } else if (nextInstance) {
        await removeInstance(nextInstance, context)
      }
    }
  }
}

const nextNodeIds = (graph) => graph.sources()

const removeGraph = async (graph, context) =>
  execGraph(
    {
      iteratee: removeNode,
      next: nextNodeIds
    },
    graph,
    context
  )

export default removeGraph
