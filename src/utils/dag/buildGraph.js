import { forEach } from '@serverless/utils'
import { Graph } from 'graphlib'
import getChildrenIds from '../component/getChildrenIds'
import getDependenciesIds from '../component/getDependenciesIds'
import getParentId from '../component/getParentId'
import walkReduceComponentChildrenDepthFirst from '../component/walkReduceComponentChildrenDepthFirst'

const buildGraph = (nextInstance, prevInstance) => {
  let graph = new Graph()

  // nextInstance nodes
  if (nextInstance && nextInstance.instanceId) {
    graph = walkReduceComponentChildrenDepthFirst(
      (accum, currentInstance) => {
        if (!currentInstance.instanceId) {
          throw new Error(
            `While building the dependency graph we detected a component instance doesn't have an instanceId. This shouldn't happen. Something has gone wrong. ${currentInstance}`
          )
        }
        const node = {
          instanceId: currentInstance.instanceId,
          operation: currentInstance.shouldDeploy(),
          nextInstance: currentInstance
        }
        accum.setNode(currentInstance.instanceId, node)

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
    // prevInstance nodes
    graph = walkReduceComponentChildrenDepthFirst(
      (accum, currentInstance) => {
        if (!currentInstance.instanceId) {
          throw new Error(
            `While building the dependency graph we detected a component instance doesn't have an instanceId. This shouldn't happen. Something has gone wrong. ${currentInstance}`
          )
        }
        let node = accum.node(currentInstance.instanceId)

        if (!node) {
          // not in graph? then the user removed it!
          node = {
            instanceId: currentInstance.instanceId,
            operation: 'remove',
            nextInstance: {} // what should be nextInstance in that case?
          }
          accum.setNode(currentInstance.instanceId, node)

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
        }
        node.prevInstance = currentInstance
        return accum
      },
      graph,
      prevInstance
    )
  }

  return graph
}

export default buildGraph
