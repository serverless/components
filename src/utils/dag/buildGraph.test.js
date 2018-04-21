const { union, keys, map } = require('ramda')
const buildGraph = require('./buildGraph')

describe('#buildGraph()', () => {
  const componentsToUse = {
    apiGateway: {
      id: 'myApiGateway',
      type: 'gateway',
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
      type: 'function',
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
      type: 'role',
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
      type: 'role',
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
      type: 'function',
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
      type: 'role',
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

  const orphanedComponents = {
    orphanedRole: {
      id: 'myOrphanedRole',
      type: 'role',
      inputs: {
        service: 'my.old.serverless.service'
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
    const command = 'deploy'
    const graph = await buildGraph(componentsToUse, orphanedComponents, command)

    const edges = graph.edges()
    const nodes = graph.nodes()
    const nodeValueResults = map((node) => {
      const val = graph.node(node)
      const { type, command } = val // eslint-disable-line no-shadow
      return {
        id: node,
        type,
        command
      }
    }, nodes)
    const expectedNodeValueResult = [
      { id: 'orphanedRole', type: 'orphan', command: 'remove' },
      { id: 'apiGateway', type: 'main', command },
      { id: 'func', type: 'main', command },
      { id: 'role', type: 'main', command },
      { id: 'apiGateway:role', type: 'main', command },
      { id: 'apiGateway:func', type: 'main', command },
      { id: 'func:role', type: 'main', command }
    ]
    expect(nodeValueResults).toEqual(expectedNodeValueResult)

    const componentKeys = union(keys(orphanedComponents), keys(componentsToUse))

    expect(nodes).toEqual(componentKeys)
    expect(edges).toContainEqual(
      { v: 'func', w: 'role' },
      {
        v: 'apiGateway',
        w: 'func'
      },
      { v: 'apiGateway', w: 'role' }
    )
  })
})
