import AWS from 'aws-sdk'
import path from 'path'
import {
  createContext,
  deserialize,
  resolveComponentEvaluables,
  serialize
} from '../../../src/utils'

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

describe('AwsS3Bucket', () => {
  it(
    'should deploy bucket when none exists',
    async () => {
      const context = await createTestContext()

      const AwsProvider = await context.loadType('AwsProvider')
      const AwsS3Bucket = await context.loadType('./')

      let awsS3Bucket = await context.construct(AwsS3Bucket, {
        provider: await context.construct(AwsProvider, {}),
        bucketName: 'bucket-abc'
      })
      awsS3Bucket = await context.defineComponent(awsS3Bucket)
      awsS3Bucket = resolveComponentEvaluables(awsS3Bucket)

      await awsS3Bucket.deploy(null, context)

      expect(AWS.mocks.createBucketMock).toBeCalledWith({ Bucket: 'bucket-abc' })
    },
    20000
  )

  it('should update when bucket name has changed', async () => {
    const context = await createTestContext()

    const AwsProvider = await context.loadType('AwsProvider')
    const AwsS3Bucket = await context.loadType('./')

    let awsS3Bucket = await context.construct(AwsS3Bucket, {
      provider: await context.construct(AwsProvider, {}),
      bucketName: 'bucket-abc'
    })
    awsS3Bucket = await context.defineComponent(awsS3Bucket)
    awsS3Bucket = resolveComponentEvaluables(awsS3Bucket)
    await awsS3Bucket.deploy(null, context)

    const prevAwsS3Bucket = await deserialize(serialize(awsS3Bucket, context), context)

    // NOTE BRN: To simulate what core does, we create an entirely new instance here but hydrate it with the previous instance

    let nextAwsS3Bucket = await context.construct(AwsS3Bucket, {
      provider: await context.construct(AwsProvider, {}),
      bucketName: 'bucket-123' // changed!
    })
    nextAwsS3Bucket = await context.defineComponent(nextAwsS3Bucket, prevAwsS3Bucket)
    nextAwsS3Bucket = resolveComponentEvaluables(nextAwsS3Bucket)

    await nextAwsS3Bucket.deploy(prevAwsS3Bucket, context)

    expect(AWS.mocks.createBucketMock).toBeCalledWith({ Bucket: 'bucket-123' })
  })

  it('shouldDeploy should return undefined when no changes have occurred', async () => {
    const context = await createTestContext()

    const AwsProvider = await context.loadType('AwsProvider')
    const AwsS3Bucket = await context.loadType('./')

    let awsS3Bucket = await context.construct(AwsS3Bucket, {
      provider: await context.construct(AwsProvider, {}),
      bucketName: 'bucket-abc'
    })
    awsS3Bucket = await context.defineComponent(awsS3Bucket)
    awsS3Bucket = resolveComponentEvaluables(awsS3Bucket)
    await awsS3Bucket.deploy(null, context)

    const prevAwsS3Bucket = await deserialize(serialize(awsS3Bucket, context), context)

    // NOTE BRN: To simulate what core does, we create an entirely new instance here but hydrate it with the previous instance

    let nextAwsS3Bucket = await context.construct(AwsS3Bucket, {
      provider: await context.construct(AwsProvider, {}),
      bucketName: 'bucket-abc'
    })
    nextAwsS3Bucket = await context.defineComponent(nextAwsS3Bucket, prevAwsS3Bucket)
    nextAwsS3Bucket = resolveComponentEvaluables(awsS3Bucket)

    const result = nextAwsS3Bucket.shouldDeploy(prevAwsS3Bucket, context)

    expect(result).toBe(undefined)
  })

  it('shouldDeploy should returns "replace" when bucket name has changed', async () => {
    const context = await createTestContext()

    const AwsProvider = await context.loadType('AwsProvider')
    const AwsS3Bucket = await context.loadType('./')

    let awsS3Bucket = await context.construct(AwsS3Bucket, {
      provider: await context.construct(AwsProvider, {}),
      bucketName: 'bucket-abc'
    })
    awsS3Bucket = await context.defineComponent(awsS3Bucket)
    awsS3Bucket = resolveComponentEvaluables(awsS3Bucket)
    await awsS3Bucket.deploy(null, context)

    const prevAwsS3Bucket = await deserialize(serialize(awsS3Bucket, context), context)

    // NOTE BRN: To simulate what core does, we create an entirely new instance here but hydrate it with the previous instance

    let nextAwsS3Bucket = await context.construct(AwsS3Bucket, {
      provider: await context.construct(AwsProvider, {}),
      bucketName: 'bucket-123' // changed!
    })
    nextAwsS3Bucket = await context.defineComponent(nextAwsS3Bucket, prevAwsS3Bucket)
    nextAwsS3Bucket = resolveComponentEvaluables(nextAwsS3Bucket)

    const result = nextAwsS3Bucket.shouldDeploy(prevAwsS3Bucket, context)

    expect(result).toBe('replace')
  })

  it('should remove bucket', async () => {
    const context = await createTestContext()

    const AwsProvider = await context.loadType('AwsProvider')
    const AwsS3Bucket = await context.loadType('./')

    let awsS3Bucket = await context.construct(AwsS3Bucket, {
      provider: await context.construct(AwsProvider, {}),
      bucketName: 'bucket-abc'
    })
    awsS3Bucket = await context.defineComponent(awsS3Bucket)
    awsS3Bucket = resolveComponentEvaluables(awsS3Bucket)
    await awsS3Bucket.deploy(null, context)

    const prevAwsS3Bucket = await deserialize(serialize(awsS3Bucket, context), context)
    await prevAwsS3Bucket.remove(context)

    expect(AWS.mocks.deleteBucketMock).toBeCalledWith({ Bucket: 'bucket-abc' })
    expect(AWS.mocks.listObjectsV2Mock).toBeCalledWith({ Bucket: 'bucket-abc' })
    expect(AWS.mocks.deleteObjectsMock).toBeCalledWith({
      Bucket: 'bucket-abc',
      Delete: { Objects: [{ Key: 'abc' }] }
    })
  })
})
