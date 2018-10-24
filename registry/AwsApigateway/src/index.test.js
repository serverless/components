const ComponentType = require('./index')

// todo mock timers
jest.setTimeout(16000)

class SuperClass {
  constructor(inputs) {
    this.inputs = inputs
  }
}

const SuperContext = {
  loadType: async () => {}
}

const mocks = {
  importRestApi: jest.fn().mockReturnValue({ id: 'my-new-id' }),
  createDeployment: jest.fn(),
  putRestApi: jest.fn(),
  deleteRestApi: jest.fn()
}

const context = {
  get: () => {},
  log: () => {}
}

const provider = {
  getSdk: () => {
    return {
      APIGateway: function() {
        return {
          importRestApi: (obj) => ({ promise: () => mocks.importRestApi(obj) }),
          createDeployment: (obj) => ({ promise: () => mocks.createDeployment(obj) }),
          putRestApi: (obj) => ({ promise: () => mocks.putRestApi(obj) }),
          deleteRestApi: (obj) => ({ promise: () => mocks.deleteRestApi(obj) })
        }
      }
    }
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AwsApiGateway', () => {
  it('should create ApiGateway if first deployment', async () => {
    const inputs = {
      provider,
      name: 'something',
      role: { arn: 'someArn' },
      routes: {}
    }
    let awsApiGateway = await ComponentType(SuperClass, SuperContext)
    awsApiGateway = new awsApiGateway(inputs, context)

    await awsApiGateway.deploy(undefined, context)

    const createDeploymentParams = {
      restApiId: 'my-new-id',
      stageName: 'dev'
    }

    expect(mocks.importRestApi).toHaveBeenCalledTimes(1)
    expect(mocks.createDeployment).toBeCalledWith(createDeploymentParams)
    expect(awsApiGateway.id).toEqual('my-new-id')
  })

  it('should update service if changed', async () => {
    const inputs = {
      provider,
      name: 'somethingNew',
      role: { arn: 'someArn' },
      routes: {}
    }
    let awsApiGateway = await ComponentType(SuperClass, SuperContext)
    awsApiGateway = new awsApiGateway(inputs, context)

    const prevInstance = {
      name: 'something',
      id: 'new-new-id',
      url: 'http://example.com/'
    }

    await awsApiGateway.deploy(prevInstance, context)

    expect(mocks.putRestApi).toHaveBeenCalledTimes(1)
    expect(mocks.createDeployment).toBeCalledWith({ restApiId: prevInstance.id, stageName: 'dev' })
  })

  it('should remove deployment', async () => {
    const prevInstance = {
      provider,
      id: 'something'
    }
    let awsApiGateway = await ComponentType(SuperClass, SuperContext)
    awsApiGateway = new awsApiGateway(prevInstance, context)
    Object.assign(awsApiGateway, prevInstance)

    await awsApiGateway.remove(context)

    expect(mocks.deleteRestApi).toBeCalledWith({ restApiId: prevInstance.id })
  })
})
