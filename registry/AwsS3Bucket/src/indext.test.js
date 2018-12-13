import AWS from 'aws-sdk'
import path from 'path'
import { deserialize, resolveComponentEvaluables, serialize } from '../../../src/utils'
import { createTestContext } from '../../../test'

beforeEach(async () => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AwsS3Bucket', () => {
  const cwd = path.resolve(__dirname, '..')
  let context
  let provider
  let AwsProvider
  let AwsS3Bucket

  beforeEach(async () => {
    context = await createTestContext({ cwd })
    AwsProvider = await context.import('AwsProvider')
    AwsS3Bucket = await context.import('./')
    provider = await context.construct(AwsProvider, {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'abc',
        secretAccessKey: 'xyz'
      }
    })
  })

  it('should throw if bucket name does not match regex', async () => {
    const inputs = {
      provider,
      bucketName: 'INVALID::BUCKET::NAME'
    }

    try {
      const awsS3Bucket = await context.construct(AwsS3Bucket, inputs)
      await context.defineComponent(awsS3Bucket)
      resolveComponentEvaluables(awsS3Bucket)
    } catch (error) {
      expect(error.message).toMatch('has invalid')
    }
  })

  it('should deploy bucket when none exists', async () => {
    let awsS3Bucket = await context.construct(AwsS3Bucket, {
      provider,
      bucketName: 'bucket-abc'
    })
    awsS3Bucket = await context.defineComponent(awsS3Bucket)
    awsS3Bucket = resolveComponentEvaluables(awsS3Bucket)

    await awsS3Bucket.deploy(null, context)

    expect(AWS.mocks.createBucketMock).toBeCalledWith({ Bucket: 'bucket-abc' })
  })

  it('should update when bucket name has changed', async () => {
    let awsS3Bucket = await context.construct(AwsS3Bucket, {
      provider,
      bucketName: 'bucket-abc'
    })
    awsS3Bucket = await context.defineComponent(awsS3Bucket)
    awsS3Bucket = resolveComponentEvaluables(awsS3Bucket)
    await awsS3Bucket.deploy(null, context)

    const prevAwsS3Bucket = await deserialize(serialize(awsS3Bucket, context), context)

    // NOTE BRN: To simulate what core does, we create an entirely new instance here but hydrate it with the previous instance

    let nextAwsS3Bucket = await context.construct(AwsS3Bucket, {
      provider,
      bucketName: 'bucket-123' // changed!
    })
    nextAwsS3Bucket = await context.defineComponent(nextAwsS3Bucket, prevAwsS3Bucket)
    nextAwsS3Bucket = resolveComponentEvaluables(nextAwsS3Bucket)

    await nextAwsS3Bucket.deploy(prevAwsS3Bucket, context)

    expect(AWS.mocks.createBucketMock).toBeCalledWith({ Bucket: 'bucket-123' })
  })

  it('should remove bucket', async () => {
    let awsS3Bucket = await context.construct(AwsS3Bucket, {
      provider,
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

  it('should remove the bucket even if it does not exist anymore', async () => {
    let awsS3Bucket = await context.construct(AwsS3Bucket, {
      provider,
      bucketName: 'already-removed-bucket'
    })
    awsS3Bucket = await context.defineComponent(awsS3Bucket)
    awsS3Bucket = resolveComponentEvaluables(awsS3Bucket)
    await awsS3Bucket.deploy(null, context)

    const prevAwsS3Bucket = await deserialize(serialize(awsS3Bucket, context), context)
    await prevAwsS3Bucket.remove(context)

    expect(AWS.mocks.listObjectsV2Mock).toBeCalledWith({ Bucket: 'already-removed-bucket' })
    expect(AWS.mocks.deleteObjectsMock).not.toBeCalled()
    expect(AWS.mocks.deleteBucketMock).not.toBeCalled()
  })

  it('sync should return removed if bucket removed from provider', async () => {
    let awsS3Bucket = await context.construct(AwsS3Bucket, {
      provider,
      bucketName: 'already-removed-bucket'
    })
    awsS3Bucket = await context.defineComponent(awsS3Bucket)
    awsS3Bucket = resolveComponentEvaluables(awsS3Bucket)
    const res = await awsS3Bucket.sync(context)
    expect(res).toBe('removed')
  })

  it('sync should NOT return removed if bucket not removed from provider', async () => {
    let awsS3Bucket = await context.construct(AwsS3Bucket, {
      provider,
      bucketName: 'existing-bucket'
    })
    awsS3Bucket = await context.defineComponent(awsS3Bucket)
    awsS3Bucket = resolveComponentEvaluables(awsS3Bucket)
    await awsS3Bucket.sync(context)
    expect(awsS3Bucket.bucketName).toBe('existing-bucket')
  })

  it('shouldDeploy should return undefined when no changes have occurred', async () => {
    let awsS3Bucket = await context.construct(AwsS3Bucket, {
      provider,
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
    let awsS3Bucket = await context.construct(AwsS3Bucket, {
      provider,
      bucketName: 'bucket-abc'
    })
    awsS3Bucket = await context.defineComponent(awsS3Bucket)
    awsS3Bucket = resolveComponentEvaluables(awsS3Bucket)
    await awsS3Bucket.deploy(null, context)

    const prevAwsS3Bucket = await deserialize(serialize(awsS3Bucket, context), context)

    // NOTE BRN: To simulate what core does, we create an entirely new instance here but hydrate it with the previous instance

    let nextAwsS3Bucket = await context.construct(AwsS3Bucket, {
      provider,
      bucketName: 'bucket-123' // changed!
    })
    nextAwsS3Bucket = await context.defineComponent(nextAwsS3Bucket, prevAwsS3Bucket)
    nextAwsS3Bucket = resolveComponentEvaluables(nextAwsS3Bucket)

    const result = nextAwsS3Bucket.shouldDeploy(prevAwsS3Bucket, context)

    expect(result).toBe('replace')
  })
})
