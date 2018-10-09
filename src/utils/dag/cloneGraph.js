import { clone, forEach, isUndefined, map } from '@serverless/utils'
import { Graph } from 'graphlib'

const cloneNodes = (graph) =>
  map((v) => {
    const nodeValue = graph.node(v)
    const parent = graph.parent(v)
    const node = { v }
    if (!isUndefined(nodeValue)) {
      node.value = nodeValue
    }
    if (!isUndefined(parent)) {
      node.parent = parent
    }
    return node
  }, graph.nodes())

const cloneEdges = (graph) =>
  map((edge) => {
    const edgeValue = graph.edge(edge)
    const edgeObject = { v: edge.v, w: edge.w }
    if (!isUndefined(edge.name)) {
      edgeObject.name = edge.name
    }
    if (!isUndefined(edgeValue)) {
      edgeObject.value = edgeValue
    }
    return edgeObject
  }, graph.edges())

const graphToObject = (graph) => {
  const object = {
    options: {
      directed: graph.isDirected(),
      multigraph: graph.isMultigraph(),
      compound: graph.isCompound()
    },
    nodes: cloneNodes(graph),
    edges: cloneEdges(graph)
  }
  if (!isUndefined(graph.graph())) {
    object.value = clone(graph.graph())
  }
  return object
}

const objectToGraph = (object) => {
  const graph = new Graph(object.options).setGraph(object.value)

  forEach((node) => {
    graph.setNode(node.v, node.value)
    if (node.parent) {
      graph.setParent(node.v, node.parent)
    }
  }, object.nodes)
  forEach((edge) => {
    graph.setEdge({ v: edge.v, w: edge.w, name: edge.name }, edge.value)
  }, object.edges)

  return graph
}

const cloneGraph = (graph) => objectToGraph(graphToObject(graph))

export default cloneGraph
