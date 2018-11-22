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

    const context = {
      log: () => {},
      debug: () => {}
    }
    const executor = {
      iteratee: jest.fn(),
      next: jest.fn((grph) => grph.sinks())
    }
    const result = execGraph(executor, graph, context)
    expect(result).toBeInstanceOf(Promise)

    await result

    const modifiedContext = {
      log: context.debug,
      debug: context.debug
    }

    expect(executor.iteratee).toHaveBeenNthCalledWith(1, testNodeB, modifiedContext)
    expect(executor.iteratee).toHaveBeenNthCalledWith(2, testNodeA, modifiedContext)
  })
})
