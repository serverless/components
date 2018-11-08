import { Graph } from 'graphlib'
import cloneGraph from './cloneGraph'

describe('#cloneGraph()', () => {
  it('clone a basic Graph', () => {
    const graph = new Graph()
    const testNodeA = {}
    const testNodeB = {}
    graph.setNode('testA', testNodeA)
    graph.setNode('testB', testNodeB)
    graph.setEdge('testA', 'testB')

    const clonedGraph = cloneGraph(graph)

    expect(clonedGraph.nodes()).toEqual(expect.arrayContaining(['testA', 'testB']))
    expect(clonedGraph.edges()).toEqual([{ v: 'testA', w: 'testB' }])
    expect(clonedGraph.node('testA')).toBe(testNodeA)
    expect(clonedGraph.node('testB')).toBe(testNodeB)
  })
})
