const { Graph } = require('graphlib')
const {
  forEach, keys, forEachObjIndexed, not, isEmpty
} = require('ramda')

module.exports = async (components) => {
  const graph = new Graph()

  forEach((componentId) => {
    graph.setNode(componentId)
  }, keys(components))

  forEachObjIndexed((component, componentId) => {
    if (not(isEmpty(component.dependencies))) {
      forEach((dependencyId) => {
        graph.nodes.setEdge(componentId, dependencyId)
      }, component.dependencies)
    }
  }, components)
  return graph
}
