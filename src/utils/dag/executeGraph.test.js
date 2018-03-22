const buildGraph = require('./buildGraph')
const executeGraph = require('./executeGraph')

jest.mock('../components/executeComponent')
const executeComponent = require('../components/executeComponent')

executeComponent.mockImplementation(() => Promise.resolve('default-component-id'))

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#executeGraph()', () => {
  let components
  let graph

  beforeEach(async () => {
    graph = await buildGraph(components, {}, '')
    jest.resetAllMocks()
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

    const res = await executeGraph(graph, components, {}, {})
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

    const res = await executeGraph(graph, components, {}, {})
    expect(res.nodes()).toEqual([])
  })

  it('should ensure that components are exercised and its promises are settled in parallel', async () => {
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
      }
    }

    executeComponent.mockImplementationOnce(() =>
      Promise.reject(new Error('myRole could not be deployed')))
    executeComponent.mockImplementationOnce(() =>
      Promise((resolve) => {
        setTimeout(() => {
          resolve()
        }, 0)
      }).resolve('myFunc'))

    await expect(executeGraph(graph, components, {}, {})).rejects.toThrow('myRole could not be deployed')

    expect(executeComponent).toHaveBeenCalledTimes(2)
  })
})
