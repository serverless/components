const { Graph } = require('graphlib')
const { forEach, keys, forEachObjIndexed, not, isEmpty } = require('ramda')
const detectCircularDeps = require('./detectCircularDeps')

module.exports = async (componentsToUse, orphanedComponents, command) => {
  let graph = new Graph()

  // the orphaned components which should be auto-removed
  forEach((componentId) => {
    // NOTE: here we're hard-coding the association of removal with the remove command
    graph.setNode(componentId, { type: 'orphan', command: 'remove' })
  }, keys(orphanedComponents))

  // the used components
  forEach((componentId) => {
    graph.setNode(componentId, { type: 'main', command })
  }, keys(componentsToUse))

  forEachObjIndexed((component, componentId) => {
    if (not(isEmpty(component.dependencies))) {
      forEach((dependencyId) => {
        if (command === 'remove') {
          graph.setEdge(dependencyId, componentId)
        } else {
          graph.setEdge(componentId, dependencyId)
        }
      }, component.dependencies)
    }
  }, componentsToUse)

  graph = detectCircularDeps(graph)

  return graph
}
