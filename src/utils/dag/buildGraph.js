const { Graph } = require('graphlib')
const { forEach, keys, forEachObjIndexed, not, isEmpty } = require('ramda')
const detectCircularDeps = require('./detectCircularDeps')

module.exports = async (componentsToUse, componentsToRemove, command) => {
  let graph = new Graph()

  // the components to remove
  forEach((componentId) => {
    // NOTE: here we're hard-coding the association of removal with the remove command
    graph.setNode(componentId, { type: 'orphan', command: 'remove' })
  }, keys(componentsToRemove))

  // the components to use (everything other than 'remove')
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
