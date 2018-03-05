const buildGraph = require('./buildGraph')
const executeGraph = require('./executeGraph')

describe('#executeGraph()', () => {
  let components
  let graph

  beforeEach(async () => {
    graph = await buildGraph(components)
  })

  it('should return the graph if it has no sinks', async () => {
    components = {
      func: {
        id: 'myFunc',
        inputs: {
          memorySize: 512,
          timeout: 60
        },
        outputs: {},
        state: {},
        dependencies: [],
        fns: {
          deploy: () => {},
          invoke: () => {},
          remove: () => {}
        }
      }
    }

    const res = await executeGraph(graph, components, 'deploy', {})
    expect(res).toEqual(graph)
  })

  it('should execute the graph and subsequently remove the nodes until done', async () => {
    components = {
      func: {
        id: 'myFunc',
        inputs: {
          memorySize: 512,
          timeout: 60
        },
        outputs: {},
        state: {},
        dependencies: [ 'role' ],
        fns: {
          deploy: () => {},
          remove: () => {},
          invoke: () => {}
        }
      },
      role: {
        id: 'myRole',
        inputs: {
          service: 'my.serverless.service'
        },
        outputs: {},
        state: {},
        dependencies: [],
        fns: {
          deploy: () => {},
          remove: () => {}
        }
      },
      'func:role': {
        id: 'funcRole',
        inputs: {
          service: 'my.function.service'
        },
        outputs: {},
        state: {},
        dependencies: [],
        fns: {
          deploy: () => {},
          remove: () => {}
        }
      }
    }

    const res = await executeGraph(graph, components, 'deploy', {})
    expect(res.nodes()).toEqual([])
  })
})
