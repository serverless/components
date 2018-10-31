const mocks = {
  createBucketMock: jest.fn().mockReturnValue('bucket-abc'),
  deleteBucketMock: jest.fn(),
  listObjectsV2Mock: jest.fn().mockImplementation((params) => {
    if (params.Bucket === 'some-already-removed-bucket') {
      return Promise.reject(new Error('The specified bucket does not exist'))
    }
    return Promise.resolve({ Contents: [{ Key: 'abc' }] })
  }),
  deleteObjectsMock: jest.fn(),
  createFunctionMock: jest.fn().mockReturnValue({ FunctionArn: 'abc:zxc' }),
  updateFunctionCodeMock: jest.fn().mockReturnValue({ FunctionArn: 'abc:zxc' }),
  updateFunctionConfigurationMock: jest.fn().mockReturnValue({ FunctionArn: 'abc:zxc' }),
  deleteFunctionMock: jest.fn()
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

const Lambda = function() {
  return {
    createFunction: (obj) => ({
      promise: () => mocks.createFunctionMock(obj)
    }),
    updateFunctionConfiguration: (obj) => ({
      promise: () => mocks.updateFunctionConfigurationMock(obj)
    }),
    updateFunctionCode: (obj) => ({
      promise: () => mocks.updateFunctionCodeMock(obj)
    }),
    deleteFunction: (obj) => ({
      promise: () => mocks.deleteFunctionMock(obj)
    })
  }
}

export default {
  mocks,
  config: {
    update: jest.fn()
  },
  S3,
  Lambda
}
