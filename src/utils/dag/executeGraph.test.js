const buildGraph = require('./buildGraph')

jest.mock('../misc/handleSignalEvents')
jest.mock('../components/executeComponent')
const executeComponent = require('../components/executeComponent')
const executeGraph = require('./executeGraph')

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
        dependencies: ['role'],
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
      Promise.reject(new Error('myRole could not be deployed'))
    )
    executeComponent.mockImplementationOnce(() =>
      Promise((resolve) => {
        setTimeout(() => {
          resolve('myFunc')
        }, 0)
      })
    )

    await expect(executeGraph(graph, components, {}, {})).rejects.toThrow(
      'myRole could not be deployed'
    )

    expect(executeComponent).toHaveBeenCalledTimes(2)
  })

  describe('when a termination signal interrupts the execution', () => {
    beforeEach(() => {
      global.signalEventHandling = {
        shouldExitGracefully: true
      }
    })

    afterEach(() => {
      delete global.signalEventHandling
    })

    it('should gracefully exit the current operation', async () => {
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
        }
      }

      await expect(executeGraph(graph, components, {}, {})).rejects.toThrow('gracefully exited')

      // TODO: be more specific about the call count here
      expect(executeComponent).toHaveBeenCalled()
    })
  })
})
