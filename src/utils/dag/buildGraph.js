import { forEach } from '@serverless/utils'
import { Graph } from 'graphlib'
import { SYMBOL_STATE } from '../constants'
import getChildrenIds from '../component/getChildrenIds'
import getDependenciesIds from '../component/getDependenciesIds'
import getParentId from '../component/getParentId'
import walkReduceComponentChildrenDepthFirst from '../component/walkReduceComponentChildrenDepthFirst'

const buildGraph = (nextInstance, prevInstance) => {
  let graph = new Graph()

  if (prevInstance && prevInstance.instanceId) {
    // prevInstance nodes
    graph = walkReduceComponentChildrenDepthFirst(
      (accum, currentInstance) => {
        if (!currentInstance.instanceId) {
          throw new Error(
            `While building the dependency graph we detected a component instance doesn't have an instanceId. This shouldn't happen. Something has gone wrong. ${currentInstance}`
          )
        }

        // if the resource has been removed from thhe provider
        // don't add it to the graph
        if (currentInstance.status !== 'removed') {
          // Default for a node is a removal operation. This will be changed in the next step if it still exists.
          accum.setNode(currentInstance.instanceId, {
            instanceId: currentInstance.instanceId,
            operation: 'remove',
            nextInstance: null,
            prevInstance: currentInstance
          })
        }
        return accum
      },
      graph,
      prevInstance
    )
  }

  // nextInstance nodes
  if (nextInstance && nextInstance.instanceId) {
    graph = walkReduceComponentChildrenDepthFirst(
      (accum, currentInstance) => {
        if (!currentInstance.instanceId) {
          throw new Error(
            `While building the dependency graph we detected a component instance doesn't have an instanceId. This shouldn't happen. Something has gone wrong. ${currentInstance}`
          )
        }

        let node = accum.node(currentInstance.instanceId)
        if (node) {
          node.nextInstance = currentInstance
          node.operation = undefined
        } else {
          node = {
            instanceId: currentInstance.instanceId,
            nextInstance: currentInstance,
            prevInstance: null,
            operation: undefined
          }

          // preserve state if it exists in the provider
          if (currentInstance[SYMBOL_STATE]) {
            node.prevInstance = currentInstance[SYMBOL_STATE]
          }
          accum.setNode(currentInstance.instanceId, node)
        }

        // edges
        const depIds = getDependenciesIds(currentInstance)
        forEach((depId) => {
          if (!depId) {
            throw new Error(`Bad dependency ID detected ${depId}`)
          }
          accum.setEdge(currentInstance.instanceId, depId)
        }, depIds)
        return accum
      },
      graph,
      nextInstance
    )
  }

  if (prevInstance && prevInstance.instanceId) {
    // prevInstance edges
    graph = walkReduceComponentChildrenDepthFirst(
      (accum, currentInstance) => {
        // Add the removed node's child edges
        const childrenIds = getChildrenIds(currentInstance)
        forEach((childId) => {
          accum.setEdge(currentInstance.instanceId, childId)
        }, childrenIds)

        // NOTE BRN: The parent node could still exist in the next instance. If it does, then we add an edge from it to this new node here. If it doesn't, then a node will be created for the parent when the walk proceeds up to the next level and an edge will be added from the parent to the child when the parent node's child edges are added.
        const parentId = getParentId(currentInstance)
        if (parentId && accum.node(parentId)) {
          accum.setEdge(parentId, currentInstance.instanceId)
        }
        return accum
      },
      graph,
      prevInstance
    )
  }

  return graph
}

export default buildGraph
