import path from 'path'
import { createContext, resolveComponentEvaluables } from '../../../src/utils'

const createTestContext = async () =>
  createContext(
    {
      cwd: path.join(__dirname, '..'),
      overrides: {
        debug: () => {},
        log: () => {}
      }
    },
    {
      app: {
        id: 'test'
      }
    }
  )

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
    const context = await createTestContext()
    const RestApi = await context.import('RestApi')
    let restApi = await context.construct(RestApi, inputs)
    restApi = resolveComponentEvaluables(restApi)

    const children = await restApi.define(context)

    expect(children).toHaveLength(2)
    const role = resolveComponentEvaluables(children.shift())
    expect(role).toMatchObject({
      name: 'AwsIamRole',
      inputs: expect.any(Object),
      roleName: `${inputs.apiName}-iam-role`
    })
    const gateway = resolveComponentEvaluables(children.shift())
    expect(gateway).toMatchObject({
      apiName: inputs.apiName,
      inputs: expect.any(Object)
    })
    expect(gateway.inputs).toMatchObject({
      apiName: inputs.apiName,
      routes: expect.any(Object)
    })
  }, 10000)
})
