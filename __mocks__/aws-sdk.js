const mocks = {
  // S3
  createBucketMock: jest.fn().mockReturnValue('bucket-abc'),
  deleteBucketMock: jest.fn().mockImplementation((params) => {
    if (params.Bucket === 'already-removed-bucket') {
      const error = new Error()
      error.code = 'NoSuchBucket'
      return Promise.reject(error)
    }
    return Promise.resolve()
  }),
  listObjectsMock: jest.fn().mockImplementation((params) => {
    if (params.Bucket === 'already-removed-bucket') {
      const error = new Error()
      error.code = 'NoSuchBucket'
      return Promise.reject(error)
    }
    return Promise.resolve({ Contents: [{ Key: 'abc' }] })
  }),
  listObjectsV2Mock: jest.fn().mockImplementation((params) => {
    if (params.Bucket === 'already-removed-bucket') {
      const error = new Error()
      error.code = 'NoSuchBucket'
      return Promise.reject(error)
    }
    return Promise.resolve({ Contents: [{ Key: 'abc' }] })
  }),
  deleteObjectMock: jest.fn().mockImplementation((params) => {
    if (params.Bucket === 'already-removed-bucket') {
      const error = new Error()
      error.code = 'NoSuchBucket'
      return Promise.reject(error)
    }
    return Promise.resolve()
  }),
  deleteObjectsMock: jest.fn().mockImplementation((params) => {
    if (params.Bucket === 'already-removed-bucket') {
      const error = new Error()
      error.code = 'NoSuchBucket'
      return Promise.reject(error)
    }
    return Promise.resolve()
  }),
  putBucketWebsiteMock: jest.fn(),
  putBucketPolicyMock: jest.fn(),
  putBucketCorsMock: jest.fn(),
  uploadMock: jest.fn(),
  addPermission: jest.fn(({ FunctionName }) => ({
    Statement: {
      Resrouce: FunctionName,
      Sid: 'sub:def'
    }
  })),

  // CloudWatchEvents
  putRule: jest.fn().mockReturnValue({ RuleArn: 'abc:zxc' }),
  putTargets: jest.fn(),
  removeTargets: jest.fn().mockImplementation((params) => {
    if (params.Rule === 'already-removed-rule') {
      const error = new Error()
      error.code = 'ResourceNotFoundException'
      return Promise.reject(error)
    }
    return Promise.resolve()
  }),
  deleteRule: jest.fn().mockImplementation((params) => {
    if (params.Name === 'already-removed-rule') {
      const error = new Error()
      error.code = 'InternalException'
      return Promise.reject(error)
    }
    return Promise.resolve()
  }),

  // Lambda
  createFunctionMock: jest.fn().mockReturnValue({ FunctionArn: 'abc:zxc' }),
  updateFunctionCodeMock: jest.fn().mockReturnValue({ FunctionArn: 'abc:zxc' }),
  updateFunctionConfigurationMock: jest.fn().mockReturnValue({ FunctionArn: 'abc:zxc' }),
  deleteFunctionMock: jest.fn().mockImplementation((params) => {
    if (params.FunctionName === 'already-removed-function') {
      const error = new Error()
      error.code = 'ResourceNotFoundException'
      return Promise.reject(error)
    }
    return Promise.resolve()
  }),

  // IAM
  createRoleMock: jest.fn().mockReturnValue({ Role: { Arn: 'arn:aws:iam::XXXXX:role/test-role' } }),
  deleteRoleMock: jest.fn().mockImplementation((params) => {
    if (params.RoleName === 'already-removed-role') {
      const error = new Error()
      error.code = 'NoSuchEntity'
      return Promise.reject(error)
    }
    return Promise.resolve({ Role: { Arn: null } })
  }),
  attachRolePolicyMock: jest.fn(),
  putRolePolicyMock: jest.fn(),
  detachRolePolicyMock: jest.fn(),
  deleteRolePolicyMock: jest.fn(),
  updateAssumeRolePolicyMock: jest.fn(),
  createPolicyMock: jest.fn().mockReturnValue({ Policy: { Arn: 'abc:xyz' } }),
  deletePolicyMock: jest.fn().mockImplementation((params) => {
    if (params.PolicyArn === 'already-removed-policy') {
      const error = new Error()
      error.code = 'NoSuchEntity'
      return Promise.reject(error)
    }
    return Promise.resolve()
  }),
  listEntitiesForPolicyMock: jest.fn().mockReturnValue({
    PolicyGroups: [{ GroupName: 'group' }],
    PolicyRoles: [{ RoleName: 'role' }],
    PolicyUsers: [{ UserName: 'user' }]
  }),
  detachGroupPolicyMock: jest.fn(),
  detachUserPolicyMock: jest.fn(),

  // SNS
  createTopicMock: jest.fn().mockReturnValue({ TopicArn: 'abc:zxc' }),
  deleteTopicMock: jest.fn().mockImplementation((params) => {
    if (params.TopicArn === 'already-removed-topic') {
      const error = new Error()
      error.code = 'NotFound'
      return Promise.reject(error)
    }
    return Promise.resolve()
  }),
  setTopicAttributesMock: jest.fn(),
  subscribeMock: jest.fn().mockReturnValue({
    SubscriptionArn: 'arn:aws:sns:region:XXXXX:test-subscription:r4nd0m'
  }),
  unsubscribeMock: jest.fn().mockImplementation((params) => {
    if (params.SubscriptionArn === 'already-removed-subscription') {
      const error = new Error()
      error.code = 'NotFound'
      return Promise.reject(error)
    }
    return Promise.resolve()
  }),

  // APIGateway
  importRestApiMock: jest.fn().mockReturnValue({ id: 'my-new-id' }),
  createDeploymentMock: jest.fn(),
  putRestApiMock: jest.fn(),
  deleteRestApiMock: jest.fn().mockImplementation((params) => {
    if (params.restApiId === 'already-removed-rest-api') {
      const error = new Error()
      error.code = 'NotFoundException'
      return Promise.reject(error)
    }
    return Promise.resolve()
  }),

  // STS
  getCallerIdentity: jest.fn().mockReturnValue(
    Promise.resolve({
      Account: 'account-id'
    })
  ),

  // DynamoDB
  createTableMock: jest.fn().mockImplementation((params) => {
    if (params.TableName === 'already-created-table') {
      const error = new Error()
      error.code = 'ResourceInUseException'
      return Promise.reject(error)
    }
    return Promise.resolve({
      TableDescription: {
        TableArn: 'arn:aws:dynamodb:region:XXXXX:table/create-table',
        TableName: 'create-table',
        TableStatus: 'CREATING'
      }
    })
  }),
  updateTableMock: jest.fn().mockImplementation((params) => {
    if (params.TableName === 'non-existent-table') {
      const error = new Error()
      error.code = 'ResourceNotFoundException'
      return Promise.reject(error)
    }
    return Promise.resolve({
      TableDescription: {
        TableArn: 'arn:aws:dynamodb:region:XXXXX:table/update-table',
        TableName: 'update-table',
        TableStatus: 'UPDATING',
        ProvisionedThroughput: {
          ReadCapacityUnits: 10,
          WriteCapacityUnits: 10
        }
      }
    })
  }),
  deleteTableMock: jest.fn().mockImplementation((params) => {
    if (params.TableName === 'already-removed-table') {
      const error = new Error()
      error.code = 'ResourceNotFoundException'
      return Promise.reject(error)
    }
    return Promise.resolve({
      TableDescription: {
        TableArn: 'arn:aws:dynamodb:region:XXXXX:table/delete-table',
        TableName: 'delete-table',
        TableStatus: 'DELETING'
      }
    })
  })
}

const APIGateway = function() {
  return {
    importRestApi: (obj) => ({
      promise: () => mocks.importRestApiMock(obj)
    }),
    createDeployment: (obj) => ({
      promise: () => mocks.createDeploymentMock(obj)
    }),
    putRestApi: (obj) => ({
      promise: () => mocks.putRestApiMock(obj)
    }),
    deleteRestApi: (obj) => ({
      promise: () => mocks.deleteRestApiMock(obj)
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
    putRolePolicy: (obj) => ({
      promise: () => mocks.putRolePolicyMock(obj)
    }),
    detachRolePolicy: (obj) => ({
      promise: () => mocks.detachRolePolicyMock(obj)
    }),
    deleteRolePolicy: (obj) => ({
      promise: () => mocks.deleteRolePolicyMock(obj)
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
    listObjects: (obj) => ({
      promise: () => mocks.listObjectsMock(obj)
    }),
    deleteBucket: (obj) => ({
      promise: () => mocks.deleteBucketMock(obj)
    }),
    deleteObjects: (obj) => ({
      promise: () => mocks.deleteObjectsMock(obj)
    }),
    deleteObject: (obj) => ({
      promise: () => mocks.deleteObjectMock(obj)
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
    createTopic: (obj) => ({
      promise: () => mocks.createTopicMock(obj)
    }),
    deleteTopic: (obj) => ({
      promise: () => mocks.deleteTopicMock(obj)
    }),
    setTopicAttributes: (obj) => ({
      promise: () => mocks.setTopicAttributesMock(obj)
    }),
    subscribe: (obj) => ({
      promise: () => mocks.subscribeMock(obj)
    }),
    unsubscribe: (obj) => ({
      promise: () => mocks.unsubscribeMock(obj)
    })
  }
}

const STS = function() {
  return {
    getCallerIdentity: (obj) => ({
      promise: () => mocks.getCallerIdentity(obj)
    })
  }
}

const DynamoDB = function() {
  return {
    createTable: (obj) => ({
      promise: () => mocks.createTableMock(obj)
    }),
    updateTable: (obj) => ({
      promise: () => mocks.updateTableMock(obj)
    }),
    deleteTable: (obj) => ({
      promise: () => mocks.deleteTableMock(obj)
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
  SNS,
  STS,
  DynamoDB
}
