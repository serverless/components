import { createContext, resolveComponentVariables } from '../../../src/utils'

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('RestApi', () => {
  it('should set IamRole and AwsRestApi children', async () => {
    const inputs = {
      provider: {},
      apiName: 'something',
      gateway: 'AwsApiGateway',
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
    const RestApi = await context.loadType('RestApi')
    let restApi = await context.construct(RestApi, inputs)
    restApi = resolveComponentVariables(restApi)

    const children = await restApi.define(context)

    expect(children).toHaveLength(2)
    const role = children.shift()
    expect(role).toMatchObject({
      name: 'AwsIamRole',
      inputs: expect.any(Object),
      roleName: `${inputs.apiName}-iam-role`
    })
    const gateway = children.shift()
    expect(gateway).toMatchObject({
      name: inputs.apiName,
      inputs: expect.any(Object)
    })
    expect(gateway.inputs).toMatchObject({
      name: inputs.apiName,
      routes: expect.any(Object)
    })
  })
})
