import { Graph } from 'graphlib'
import execGraph from './execGraph'
import logStatus from './logStatus'

jest.mock('./logStatus')

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#execGraph()', () => {
  let graph
  const testNodeA = {}
  const testNodeB = {}
  const context = {
    log: () => {},
    debug: () => {}
  }
  const executor = {
    iteratee: jest.fn(),
    next: jest.fn((grph) => grph.sinks())
  }

  beforeEach(() => {
    graph = new Graph()
    graph.setNode('testA', testNodeA)
    graph.setNode('testB', testNodeB)
    graph.setEdge('testA', 'testB')
  })

  it('execute a basic Graph', async () => {
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

  it('should log the current status while executing graph operations', async () => {
    await execGraph(executor, graph, context)

    expect(logStatus).toBeCalledTimes(2)
  })
})
