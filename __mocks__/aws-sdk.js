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

const S3 = function() {
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

export default {
  mocks,
  config: {
    update: jest.fn()
  },
  S3
}
