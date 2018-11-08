import { Graph } from 'graphlib'
import execGraph from './execGraph'

describe('#execGraph()', () => {
  it('execute a basic Graph', async () => {
    const graph = new Graph()
    const testNodeA = {}
    const testNodeB = {}
    graph.setNode('testA', testNodeA)
    graph.setNode('testB', testNodeB)
    graph.setEdge('testA', 'testB')

    const testContext = {
      debug: () => {},
      log: () => {}
    }
    const executor = {
      iteratee: jest.fn(),
      next: jest.fn((grph) => grph.sinks())
    }
    const result = execGraph(executor, graph, testContext)
    expect(result).toBeInstanceOf(Promise)

    await result

    expect(executor.iteratee).toHaveBeenNthCalledWith(1, testNodeB, testContext)
    expect(executor.iteratee).toHaveBeenNthCalledWith(2, testNodeA, testContext)
  })
})
