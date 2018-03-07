const buildGraph = require('./buildGraph')

describe('#buildGraph()', () => {
  const components = {
    apiGateway: {
      id: 'myApiGateway',
      inputs: {
        method: 'POST',
        path: 'my-path'
      },
      outputs: {},
      state: {},
      dependencies: [ 'role', 'func' ],
      fns: {
        deploy: () => {},
        remove: () => {}
      }
    },
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
    'apiGateway:role': {
      id: 'apiGatewayRole',
      inputs: {
        service: 'my.api-gateway.service'
      },
      outputs: {},
      state: {},
      dependencies: [],
      fns: {
        deploy: () => {},
        remove: () => {}
      }
    },
    'apiGateway:func': {
      id: 'apiGatewayFunc',
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

  it('should return a correct graphlib Graph', async () => {
    const graph = await buildGraph(components)

    expect(graph.nodes()).toEqual(Object.keys(components))
    expect(graph.edges()).toContainEqual(
      { v: 'func', w: 'role' },
      {
        v: 'apiGateway',
        w: 'func'
      },
      { v: 'apiGateway', w: 'role' }
    )
  })
})
