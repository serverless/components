import AWS from 'aws-sdk'
import path from 'path'
import { deserialize, resolveComponentEvaluables, serialize } from '../../../src/utils'
import { createTestContext } from '../../../test'

jest.mock('folder-hash', () => ({
  hashElement: jest.fn().mockReturnValue({ hash: 'abc' })
}))

jest.mock('fs', () => ({
  ...require.requireActual('fs'),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn()
}))

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AwsS3Website', () => {
  const cwd = path.resolve(__dirname, '..')
  let context
  let provider
  let AwsS3Website

  beforeEach(async () => {
    context = await createTestContext({ cwd })
    AwsS3Website = await context.import('./')

    const AwsProvider = await context.import('AwsProvider')
    provider = await context.construct(AwsProvider, {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'abc',
        secretAccessKey: 'xyz'
      }
    })
  })

  it('should create bucket if first deployment', async () => {
    let oldAwsS3Website = await context.construct(AwsS3Website, {
      provider,
      bucket: 'abc',
      projectDir: path.resolve('./registry'),
      assets: path.resolve('./registry'),
      envFileLocation: path.resolve('./src/index.js')
    })
    oldAwsS3Website = await context.defineComponent(oldAwsS3Website)
    oldAwsS3Website = resolveComponentEvaluables(oldAwsS3Website)
    await oldAwsS3Website.deploy(null, context)

    expect(AWS.mocks.createBucketMock).toBeCalledWith({ Bucket: 'abc' })
    expect(AWS.mocks.putBucketPolicyMock).toHaveBeenCalled()
    expect(AWS.mocks.putBucketCorsMock).toHaveBeenCalled()
    expect(AWS.mocks.putBucketWebsiteMock).toHaveBeenCalled()
  })

  it('should remove bucket', async () => {
    let oldAwsS3Website = await context.construct(AwsS3Website, {
      provider,
      bucket: 'abc',
      projectDir: path.resolve('./registry'),
      assets: path.resolve('./registry'),
      envFileLocation: path.resolve('./src/index.js')
    })
    oldAwsS3Website = await context.defineComponent(oldAwsS3Website)
    oldAwsS3Website = resolveComponentEvaluables(oldAwsS3Website)
    await oldAwsS3Website.deploy(null, context)

    const prevAwsS3Website = await deserialize(serialize(oldAwsS3Website, context), context)
    await prevAwsS3Website.remove(context)

    expect(AWS.mocks.deleteBucketMock).toBeCalledWith({ Bucket: 'abc' })
    expect(AWS.mocks.listObjectsMock).toBeCalledWith({ Bucket: 'abc' })
    expect(AWS.mocks.deleteObjectMock).toHaveBeenCalled()
  })

  it('should remove the bucket even if it does not exist anymore', async () => {
    let oldAwsS3Website = await context.construct(AwsS3Website, {
      provider,
      bucket: 'already-removed-bucket',
      projectDir: path.resolve('./registry'),
      assets: path.resolve('./registry'),
      envFileLocation: path.resolve('./src/index.js')
    })
    oldAwsS3Website = await context.defineComponent(oldAwsS3Website)
    oldAwsS3Website = resolveComponentEvaluables(oldAwsS3Website)
    await oldAwsS3Website.deploy(null, context)

    const prevAwsS3Website = await deserialize(serialize(oldAwsS3Website, context), context)
    await prevAwsS3Website.remove(context)

    expect(AWS.mocks.listObjectsMock).toBeCalledWith({ Bucket: 'already-removed-bucket' })
    expect(AWS.mocks.deleteObjectMock).not.toHaveBeenCalled()
    expect(AWS.mocks.deleteBucketMock).not.toHaveBeenCalled()
  })

  it('shouldDeploy should return undefined if no changes', async () => {
    let oldAwsS3Website = await context.construct(AwsS3Website, {
      provider,
      bucket: 'abc',
      projectDir: path.resolve('./registry'),
      assets: path.resolve('./registry'),
      envFileLocation: path.resolve('./src/index.js')
    })
    oldAwsS3Website = await context.defineComponent(oldAwsS3Website)
    oldAwsS3Website = resolveComponentEvaluables(oldAwsS3Website)
    await oldAwsS3Website.shouldDeploy(null, context)
    await oldAwsS3Website.deploy(null, context)

    const prevAwsS3Website = await deserialize(serialize(oldAwsS3Website, context), context)

    let newAwsS3Website = await context.construct(AwsS3Website, {
      provider,
      bucket: 'abc',
      projectDir: path.resolve('./registry'),
      assets: path.resolve('./registry'),
      envFileLocation: path.resolve('./src/index.js')
    })
    newAwsS3Website = await context.defineComponent(newAwsS3Website)
    newAwsS3Website = resolveComponentEvaluables(newAwsS3Website)

    const res = await newAwsS3Website.shouldDeploy(prevAwsS3Website)
    expect(res).toBe(undefined)
  })

  it('shouldDeploy should return deploy if first deployment', async () => {
    let oldAwsS3Website = await context.construct(AwsS3Website, {
      provider,
      bucket: 'abc',
      projectDir: path.resolve('./registry'),
      assets: path.resolve('./registry'),
      envFileLocation: path.resolve('./src/index.js')
    })
    oldAwsS3Website = await context.defineComponent(oldAwsS3Website)
    oldAwsS3Website = resolveComponentEvaluables(oldAwsS3Website)
    const res = await oldAwsS3Website.shouldDeploy(null, context)
    expect(res).toBe('deploy')
  })

  it('shouldDeploy should return deploy if config changed', async () => {
    let oldAwsS3Website = await context.construct(AwsS3Website, {
      provider,
      bucket: 'abc',
      projectDir: path.resolve('./registry'),
      assets: path.resolve('./registry'),
      envFileLocation: path.resolve('./src/index.js')
    })
    oldAwsS3Website = await context.defineComponent(oldAwsS3Website)
    oldAwsS3Website = resolveComponentEvaluables(oldAwsS3Website)
    await oldAwsS3Website.deploy(null, context)

    const prevAwsS3Website = await deserialize(serialize(oldAwsS3Website, context), context)

    let newAwsS3Website = await context.construct(AwsS3Website, {
      provider,
      bucket: 'abc',
      projectDir: path.resolve('./src'),
      assets: path.resolve('./registry'),
      envFileLocation: path.resolve('./src/index.js')
    })
    newAwsS3Website = await context.defineComponent(newAwsS3Website)
    newAwsS3Website = resolveComponentEvaluables(newAwsS3Website)

    const res = await newAwsS3Website.shouldDeploy(prevAwsS3Website)
    expect(res).toBe('deploy')
  })

  it('shouldDeploy should return replace if bucket changed', async () => {
    let oldAwsS3Website = await context.construct(AwsS3Website, {
      provider,
      bucket: 'abc',
      projectDir: path.resolve('./registry'),
      assets: path.resolve('./registry'),
      envFileLocation: path.resolve('./src/index.js')
    })
    oldAwsS3Website = await context.defineComponent(oldAwsS3Website)
    oldAwsS3Website = resolveComponentEvaluables(oldAwsS3Website)
    await oldAwsS3Website.deploy(null, context)

    const prevAwsS3Website = await deserialize(serialize(oldAwsS3Website, context), context)

    let newAwsS3Website = await context.construct(AwsS3Website, {
      provider,
      bucket: 'zxc',
      projectDir: path.resolve('./registry'),
      assets: path.resolve('./registry'),
      envFileLocation: path.resolve('./src/index.js')
    })
    newAwsS3Website = await context.defineComponent(newAwsS3Website)
    newAwsS3Website = resolveComponentEvaluables(newAwsS3Website)

    const res = await newAwsS3Website.shouldDeploy(prevAwsS3Website)
    expect(res).toBe('replace')
  })
})
