const { Graph } = require('graphlib')
const {
  forEach, keys, forEachObjIndexed, not, isEmpty
} = require('ramda')

module.exports = async (componentsToUse, componentsToRemove, command) => {
  const graph = new Graph()

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
        graph.setEdge(componentId, dependencyId)
      }, component.dependencies)
    }
  }, componentsToUse)

  return graph
}
