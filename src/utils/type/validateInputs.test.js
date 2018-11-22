import { createTestContext } from '../../../test'

describe('validateInputs', () => {
  let context
  let AwsProvider
  let AwsLambdaFunction
  let provider

  beforeEach(async () => {
    context = await createTestContext()
    AwsProvider = await context.loadType('AwsProvider')
    AwsLambdaFunction = await context.loadType('AwsLambdaFunction')
    provider = await context.construct(AwsProvider, {})
  })
  it('should not throw error if Type has no inputTypes', async () => {
    const Plugin = await context.loadType('Plugin')
    await context.construct(Plugin, {})
  })

  it('should not throw error if inputTypes are valid', async () => {
    await context.construct(AwsLambdaFunction, {
      provider,
      code: './code',
      functionName: 'hello',
      handler: 'index.hello',
      runtime: 'nodejs8.10'
    })
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
