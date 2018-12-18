import { createTestContext } from '../../../test'

describe('validateInputs', () => {
  let context
  let AwsProvider
  let AwsLambdaFunction
  let provider

  beforeEach(async () => {
    context = await createTestContext()
    AwsProvider = await context.import('AwsProvider')
    AwsLambdaFunction = await context.import('AwsLambdaFunction')
    provider = context.construct(AwsProvider, {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'abc',
        secretAccessKey: 'xyz'
      }
    })
  })

  it('should not throw error if Type has no inputTypes', async () => {
    const Plugin = await context.import('Plugin')
    const result = context.construct(Plugin, {})
    expect(result).toBeDefined()
  })

  it('should not throw error if inputTypes are valid', async () => {
    const result = context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      handler: 'index.hello',
      runtime: 'nodejs8.10'
    })
    expect(result).toBeDefined()
  })

  it('should throw error if inputTypes are invalid', async () => {
    expect(() =>
      context.construct(AwsLambdaFunction, {
        provider,
        code: './code',
        functionName: 'hello',
        // handler: 'index.hello', required, but missing!
        runtime: 'nodejs8.10'
      })
    ).toThrow('has invalid')
  })
})
