import { forEach, get } from '@serverless/utils'
import { Graph } from 'graphlib'
import getChildrenIds from '../component/getChildrenIds'
import walkReduceComponentDepthFirst from '../component/walkReduceComponentDepthFirst'

const buildGraph = (nextInstance, prevInstance) => {
  let graph = new Graph()

  // nextInstance nodes
  graph = walkReduceComponentDepthFirst(
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
      return accum
    },
    graph,
    nextInstance
  )

  // edges
  graph = walkReduceComponentDepthFirst(
    (accum, currentInstance) => {
      const childrenIds = getChildrenIds(currentInstance)
      forEach((childId) => {
        accum.setEdge(currentInstance.instanceId, childId)
      }, childrenIds)
      return accum
    },
    graph,
    nextInstance
  )

  if (prevInstance) {
    // prevInstance nodes
    graph = walkReduceComponentDepthFirst(
      (accum, currentInstance) => {
        console.log('prevInstance nodes currentInstance:', currentInstance)
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
          accum.setEdge(currentInstance.parent, currentInstance.instanceId) // edge from parent to child
        }
        node.prevInstance = currentInstance
        accum.setNode(currentInstance.instanceId, node)
        return accum
      },
      graph,
      prevInstance
    )
  }

  return graph
}

export default buildGraph
