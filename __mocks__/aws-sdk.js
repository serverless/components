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
  putRule: jest.fn().mockReturnValue({ RuleArn: 'abc:zxc' }),
  putTargets: jest.fn(),
  removeTargets: jest.fn(),
  deleteRule: jest.fn(),
  addPermission: jest.fn()
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
    addPermission: (obj) => ({
      promise: () => mocks.addPermission(obj)
    })
  }
}

const CloudWatchEvents = function() {
  return {
    putRule: (obj) => ({
      promise: () => mocks.putRule(obj)
    }),
    putTargets: (obj) => ({
      promise: () => mocks.putTargets(obj)
    }),
    removeTargets: (obj) => ({
      promise: () => mocks.removeTargets(obj)
    }),
    deleteRule: (obj) => ({
      promise: () => mocks.deleteRule(obj)
    })
  }
}

export default {
  mocks,
  config: {
    update: jest.fn()
  },
  S3,
  Lambda,
  CloudWatchEvents
}
