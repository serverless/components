import path from 'path'
import { resolveComponentEvaluables } from '../../../src/utils'
import { createTestContext } from '../../../test'

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('RestApi', () => {
  const cwd = path.resolve(__dirname, '..')
  let context
  let AwsProvider
  let AwsIamRole
  let AwsApiGateway
  let RestApi
  let provider

  beforeEach(async () => {
    context = await createTestContext({ cwd })
    AwsProvider = await context.import('AwsProvider')
    AwsIamRole = await context.import('AwsIamRole')
    AwsApiGateway = await context.import('AwsApiGateway')
    RestApi = await context.import('./')
    provider = context.construct(AwsProvider, {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'abc',
        secretAccessKey: 'xyz'
      }
    })
  })

  it('should set AwsIamRole and AwsRestApi children', async () => {
    const inputs = {
      provider,
      apiName: 'something',
      gateway: 'AwsApiGateway',
      routes: {}
    }
    let restApi = context.construct(RestApi, inputs)
    restApi = resolveComponentEvaluables(restApi)

    const children = await restApi.define(context)

    const role = resolveComponentEvaluables(children.role)
    const gateway = resolveComponentEvaluables(children.gateway)

    expect(Object.keys(children)).toHaveLength(2)
    expect(role).toBeInstanceOf(AwsIamRole.class)
    expect(gateway).toBeInstanceOf(AwsApiGateway.class)
  })
})
