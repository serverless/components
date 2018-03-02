const { Graph } = require('graphlib')
const {
  forEach, keys, forEachObjIndexed, not, isEmpty
} = require('ramda')

const getComponentDependencies = require('../components/getComponentDependencies')

module.exports = async (components) => {
  const graph = new Graph()

  forEach((componentId) => {
    graph.setNode(componentId)
  }, keys(components))

  forEachObjIndexed((component, componentId) => {
    const componentDependencies = getComponentDependencies(component.inputs)
    if (not(isEmpty(componentDependencies))) {
      forEach((dependencyId) => {
        graph.nodes.setEdge(componentId, dependencyId)
      }, componentDependencies)
    }
  }, components)
  return graph
}
