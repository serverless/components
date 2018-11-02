const mocks = {
  // S3
  createBucketMock: jest.fn().mockReturnValue('bucket-abc'),
  deleteBucketMock: jest.fn(),
  listObjectsV2Mock: jest.fn().mockImplementation((params) => {
    if (params.Bucket === 'some-already-removed-bucket') {
      return Promise.reject(new Error('The specified bucket does not exist'))
    }
    return Promise.resolve({ Contents: [{ Key: 'abc' }] })
  }),
  deleteObjectsMock: jest.fn(),
  putBucketWebsiteMock: jest.fn(),
  putBucketPolicyMock: jest.fn(),
  putBucketCorsMock: jest.fn(),
  uploadMock: jest.fn(),
  putRule: jest.fn().mockReturnValue({ RuleArn: 'abc:zxc' }),
  putTargets: jest.fn(),
  removeTargets: jest.fn(),
  deleteRule: jest.fn(),
  addPermission: jest.fn(),
  // Lambda
  createFunctionMock: jest.fn().mockReturnValue({ FunctionArn: 'abc:zxc' }),
  updateFunctionCodeMock: jest.fn().mockReturnValue({ FunctionArn: 'abc:zxc' }),
  updateFunctionConfigurationMock: jest.fn().mockReturnValue({ FunctionArn: 'abc:zxc' }),
  deleteFunctionMock: jest.fn(),
  // IAM
  createRoleMock: jest.fn().mockReturnValue({ Role: { Arn: 'arn:aws:iam::XXXXX:role/test-role' } }),
  deleteRoleMock: jest.fn().mockImplementation((params) => {
    if (params.RoleName === 'some-already-removed-role') {
      return Promise.reject(new Error('Role not found'))
    }
    return Promise.resolve({ Role: { Arn: null } })
  }),
  attachRolePolicyMock: jest.fn(),
  detachRolePolicyMock: jest.fn(),
  updateAssumeRolePolicyMock: jest.fn(),
  createPolicyMock: jest.fn().mockReturnValue({ Policy: { Arn: 'abc:xyz' } }),
  deletePolicyMock: jest.fn(),
  listEntitiesForPolicyMock: jest.fn().mockReturnValue({
    PolicyGroups: ['group'],
    PolicyRoles: ['role'],
    PolicyUsers: ['user']
  }),
  detachGroupPolicyMock: jest.fn(),
  detachUserPolicyMock: jest.fn(),
  // SNS
  subscribeMock: jest.fn().mockReturnValue({
    SubscriptionArn: 'arn:aws:sns:region:XXXXX:test-subscription:r4nd0m'
  }),
  unsubscribeMock: jest.fn(),

  // APIGateway
  importRestApi: jest.fn().mockReturnValue({ id: 'my-new-id' }),
  createDeployment: jest.fn(),
  putRestApi: jest.fn(),
  deleteRestApi: jest.fn()
}

const APIGateway = function() {
  return {
    importRestApi: (obj) => ({
      promise: () => mocks.importRestApi(obj)
    }),
    createDeployment: (obj) => ({
      promise: () => mocks.createDeployment(obj)
    }),
    putRestApi: (obj) => ({
      promise: () => mocks.putRestApi(obj)
    }),
    deleteRestApi: (obj) => ({
      promise: () => mocks.deleteRestApi(obj)
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

const IAM = function() {
  return {
    createRole: (obj) => ({
      promise: () => mocks.createRoleMock(obj)
    }),
    deleteRole: (obj) => ({
      promise: () => mocks.deleteRoleMock(obj)
    }),
    attachRolePolicy: (obj) => ({
      promise: () => mocks.attachRolePolicyMock(obj)
    }),
    detachRolePolicy: (obj) => ({
      promise: () => mocks.detachRolePolicyMock(obj)
    }),
    updateAssumeRolePolicy: (obj) => ({
      promise: () => mocks.updateAssumeRolePolicyMock(obj)
    }),
    createPolicy: (obj) => ({
      promise: () => mocks.createPolicyMock(obj)
    }),
    deletePolicy: (obj) => ({
      promise: () => mocks.deletePolicyMock(obj)
    }),
    listEntitiesForPolicy: (obj) => ({
      promise: () => mocks.listEntitiesForPolicyMock(obj)
    }),
    detachGroupPolicy: (obj) => ({
      promise: () => mocks.detachGroupPolicyMock(obj)
    }),
    detachUserPolicy: (obj) => ({
      promise: () => mocks.detachUserPolicyMock(obj)
    })
  }
}

const Lambda = function() {
  return {
    addPermission: (obj) => ({
      promise: () => mocks.addPermission(obj)
    }),
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
    }),
    upload: (obj) => ({
      promise: () => mocks.uploadMock(obj)
    }),
    putBucketPolicy: (obj) => ({
      promise: () => mocks.putBucketPolicyMock(obj)
    }),
    putBucketCors: (obj) => ({
      promise: () => mocks.putBucketCorsMock(obj)
    }),
    putBucketWebsite: (obj) => ({
      promise: () => mocks.putBucketWebsiteMock(obj)
    })
  }
}

const SNS = function() {
  return {
    subscribe: (obj) => ({
      promise: () => mocks.subscribeMock(obj)
    }),
    unsubscribe: (obj) => ({
      promise: () => mocks.unsubscribeMock(obj)
    })
  }
}

export default {
  mocks,
  config: {
    update: jest.fn()
  },
  APIGateway,
  CloudWatchEvents,
  IAM,
  Lambda,
  S3,
  SNS
}
