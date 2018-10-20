import path from 'path'
import { createContext } from '../../../src/utils'

const mocks = {
  createBucketMock: jest.fn().mockReturnValue('bucket-abc'),
  deleteBucketMock: jest.fn(),
  listObjectsV2Mock: jest.fn().mockImplementation((params) => {
    if (params.Bucket === 'some-already-removed-bucket') {
      return Promise.reject(new Error('The specified bucket does not exist'))
    }
    return Promise.resolve({ Contents: [{ Key: 'abc' }] })
  }),
  deleteObjectsMock: jest.fn()
}

const provider = {
  getSdk: () => {
    return {
      S3: function() {
        return {
          createBucket: (obj) => ({
            promise: () => mocks.createBucketMock(obj)
          }),
          listObjectsV2: (obj) => ({
            promise: () => mocks.listObjectsV2Mock(obj)
          }),
          deleteBucket: (obj) => ({
            promise: () => mocks.deleteBucketMock(obj)
          }),
          deleteObjects: (obj) => ({
            promise: () => mocks.deleteObjectsMock(obj)
          })
        }
      }
    }
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AwsS3Bucket', () => {
  it('should deploy bucket', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const inputs = {
      provider,
      bucketName: 'bucket-abc'
    }

    const AwsS3Bucket = await context.loadType('./')
    const awsS3Bucket = await context.construct(AwsS3Bucket, inputs)

    awsS3Bucket.deploy(undefined, context)

    expect(mocks.createBucketMock).toBeCalledWith({ Bucket: 'bucket-abc' })
  })

  it('should remove bucket', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const inputs = {
      provider,
      bucketName: 'bucket-abc'
    }

    const AwsS3Bucket = await context.loadType('./')
    const awsS3Bucket = await context.construct(AwsS3Bucket, inputs)

    await awsS3Bucket.remove(context)

    expect(mocks.deleteBucketMock).toBeCalledWith({ Bucket: 'bucket-abc' })
    expect(mocks.listObjectsV2Mock).toBeCalledWith({ Bucket: 'bucket-abc' })
    expect(mocks.deleteObjectsMock).toBeCalledWith({
      Bucket: 'bucket-abc',
      Delete: { Objects: [{ Key: 'abc' }] }
    })
  })
})
