import { createContext, resolveComponentVariables } from '../../../src/utils'

// todo mock timers
jest.setTimeout(16000)

const mocks = {
  importRestApi: jest.fn().mockReturnValue({ id: 'my-new-id' }),
  createDeployment: jest.fn(),
  putRestApi: jest.fn(),
  deleteRestApi: jest.fn()
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
  },
  region: 'us-east-1'
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
    const context = await createContext(
      {},
      {
        app: {
          id: 'test'
        }
      }
    )
    const AwsApiGateway = await context.loadType('AwsApiGateway')
    let awsApiGateway = await context.construct(AwsApiGateway, inputs)
    awsApiGateway = resolveComponentVariables(awsApiGateway)

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
    const context = await createContext(
      {},
      {
        app: {
          id: 'test'
        }
      }
    )
    const AwsApiGateway = await context.loadType('AwsApiGateway')
    let awsApiGateway = await context.construct(AwsApiGateway, inputs)
    awsApiGateway = resolveComponentVariables(awsApiGateway)

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
    // const prevInstance = {
    //   provider,
    //   id: 'something'
    // }
    // const context = await createContext(
    //     {},
    //     {
    //       app: {
    //         id: 'test'
    //       }
    //     }
    //   )
    // const AwsApiGateway = await context.loadType('AwsApiGateway')
    // let awsApiGateway = context.construct(AwsApiGateway, inputs)
    // Object.assign(awsApiGateway, prevInstance)
    //
    // await awsApiGateway.remove(context)
    //
    // expect(mocks.deleteRestApi).toBeCalledWith({ restApiId: prevInstance.id })
  })
})
