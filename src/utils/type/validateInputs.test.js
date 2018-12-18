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
    provider = await context.construct(AwsProvider, {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'abc',
        secretAccessKey: 'xyz'
      }
    })
  })
  it('should not throw error if Type has no inputTypes', async () => {
    const Plugin = await context.import('Plugin')
    await expect(context.construct(Plugin, {})).resolves.toBeDefined()
  })

  it('should not throw error if inputTypes are valid', async () => {
    await expect(
      context.construct(AwsLambdaFunction, {
        provider,
        code: './code',
        functionName: 'hello',
        handler: 'index.hello',
        runtime: 'nodejs8.10'
      })
    ).resolves.toBeDefined()
  })

  it('should throw error if inputTypes are invalid', async () => {
    await expect(
      context.construct(AwsLambdaFunction, {
        provider,
        code: './code',
        functionName: 'hello',
        // handler: 'index.hello', required, but missing!
        runtime: 'nodejs8.10'
      })
    ).rejects.toThrow('has invalid')
  })
})
