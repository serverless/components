import { Graph } from 'graphlib'
import { forEach } from '@serverless/utils'
import { walkReduceComponentDepthFirst } from '../component/walkReduceComponentDepthFirst'

const buildGraph = (nextInstance, prevInstance) => {
  let graph = new Graph()

  // nextInstance nodes
  graph = walkReduceComponentDepthFirst(
    (accum, currentInstance) => {
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
      const childrenIds = currentInstance.getChildrenIds()
      forEach((childId) => {
        accum.setEdge(currentInstance.instanceId, childId)
      }, childrenIds)
      return accum
    },
    graph,
    nextInstance
  )

  // prevInstance nodes
  graph = walkReduceComponentDepthFirst(
    (accum, currentInstance) => {
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

  return graph
}

export default buildGraph

// const { Graph } = require('graphlib')
// const { forEach, keys, forEachObjIndexed, not, isEmpty } = require('ramda')
// const detectCircularDeps = require('./detectCircularDeps')
//
// module.exports = async (componentsToUse, orphanedComponents, command) => {
//   let graph = new Graph()
//
//   // the orphaned components which should be auto-removed
//   forEach((componentId) => {
//     // NOTE: here we're hard-coding the association of removal with the remove command
//     graph.setNode(componentId, { type: 'orphan', command: 'remove', instance })
//   }, keys(orphanedComponents))
//
//   // the used components
//   forEach((componentId) => {
//     graph.setNode(componentId, { type: 'main', command })
//   }, keys(componentsToUse))
//
//   forEachObjIndexed((component, componentId) => {
//     if (not(isEmpty(component.dependencies))) {
//       forEach((dependencyId) => {
//         if (command === 'remove') {
//           graph.setEdge(dependencyId, componentId)
//         } else {
//           graph.setEdge(componentId, dependencyId)
//         }
//       }, component.dependencies)
//     }
//   }, componentsToUse)
//
//   graph = detectCircularDeps(graph)
//
//   return graph
// }
