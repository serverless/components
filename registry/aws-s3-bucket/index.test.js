const AWS = require('aws-sdk')
const s3Component = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    createBucketMock: jest.fn().mockReturnValue('bucket-abc'),
    deleteBucketMock: jest.fn().mockImplementation((params) => {
      if (params.Bucket === 'some-already-removed-bucket') {
        return Promise.reject(new Error('The specified bucket does not exist'))
      }
      return Promise.resolve()
    }),
    listObjectsV2Mock: jest.fn().mockReturnValue({ Contents: [{ Key: 'abc' }] }),
    deleteObjectsMock: jest.fn()
  }

  const S3 = {
    createBucket: (obj) => ({
      promise: () => mocks.createBucketMock(obj)
    }),
    deleteBucket: (obj) => ({
      promise: () => mocks.deleteBucketMock(obj)
    }),
    listObjectsV2: (obj) => ({
      promise: () => mocks.listObjectsV2Mock(obj)
    }),
    deleteObjects: (obj) => ({
      promise: () => mocks.deleteObjectsMock(obj)
    })
  }
  return {
    mocks,
    S3: jest.fn().mockImplementation(() => S3)
  }
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('aws-s3-bucket tests', () => {
  it('should deploy s3 component with no errors', async () => {
    const s3ContextMock = {
      state: {},
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'some-bucket-name'
    }

    const outputs = await s3Component.deploy(inputs, s3ContextMock)

    expect(AWS.S3).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createBucketMock).toHaveBeenCalledTimes(1)
    expect(outputs.name).toEqual(inputs.name)
    expect(s3ContextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should deploy s3 component a second time with no errors', async () => {
    const s3ContextMock = {
      state: {
        name: 'some-bucket-name'
      },
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'some-bucket-name'
    }

    const outputs = await s3Component.deploy(inputs, s3ContextMock)

    expect(AWS.S3).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createBucketMock).toHaveBeenCalledTimes(1) // from the previous deploy
    expect(outputs.name).toEqual(inputs.name)
    expect(s3ContextMock.saveState).toHaveBeenCalledTimes(0)
  })

  it('should remove a non-deployed s3 component with no errors', async () => {
    const s3ContextMock = {
      state: {},
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'some-bucket-name'
    }

    const outputs = await s3Component.remove(inputs, s3ContextMock)

    expect(AWS.S3).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteBucketMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.listObjectsV2Mock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteObjectsMock).toHaveBeenCalledTimes(0)
    expect(s3ContextMock.saveState).toHaveBeenCalledTimes(0)
    expect(outputs).toEqual({})
  })

  it('should remove the s3 component after a deployment with no errors', async () => {
    const s3ContextMock = {
      state: {
        name: 'some-bucket-name'
      },
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'some-bucket-name'
    }

    const outputs = await s3Component.remove(inputs, s3ContextMock)

    expect(AWS.S3).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteBucketMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.listObjectsV2Mock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteObjectsMock).toHaveBeenCalledTimes(1)
    expect(s3ContextMock.saveState).toHaveBeenCalledTimes(1)
    expect(outputs).toEqual({ name: null })
  })

  it('should update the state when removing an already removed bucket component', async () => {
    const s3ContextMock = {
      state: {
        name: 'some-bucket-name'
      },
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'some-already-removed-bucket'
    }

    const outputs = await s3Component.remove(inputs, s3ContextMock)

    expect(AWS.S3).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteBucketMock).toHaveBeenCalledTimes(2)
    expect(AWS.mocks.listObjectsV2Mock).toHaveBeenCalledTimes(2)
    expect(AWS.mocks.deleteObjectsMock).toHaveBeenCalledTimes(2)
    expect(s3ContextMock.saveState).toHaveBeenCalledTimes(1)
    expect(outputs).toEqual({ name: null })
  })

  it('should update the bucket name when input name is changed', async () => {
    const s3ContextMock = {
      state: {
        name: 'some-bucket-name'
      },
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'new-bucket-name'
    }

    const outputs = await s3Component.deploy(inputs, s3ContextMock)

    expect(AWS.S3).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createBucketMock).toHaveBeenCalledTimes(2)
    expect(AWS.mocks.deleteBucketMock).toHaveBeenCalledTimes(3)
    expect(AWS.mocks.listObjectsV2Mock).toHaveBeenCalledTimes(3)
    expect(AWS.mocks.deleteObjectsMock).toHaveBeenCalledTimes(3)
    expect(s3ContextMock.saveState).toHaveBeenCalledTimes(1)
    expect(outputs).toEqual({ name: inputs.name })

    expect(AWS.mocks.createBucketMock.mock.calls[1][0]).toEqual({ Bucket: inputs.name })
    expect(AWS.mocks.deleteBucketMock.mock.calls[1][0]).toEqual({
      Bucket: s3ContextMock.state.name
    })
  })
})
