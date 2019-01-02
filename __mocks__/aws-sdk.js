const mocks = {
  // STS
  getCallerIdentityMock: jest.fn().mockReturnValue({
    ResponseMetadata: { RequestId: 'a86b5dcc-fs72-11e8-8543-f1d7b3effb31' },
    UserId: '558750028299',
    Account: '558750028299',
    Arn: 'arn:aws:iam::558750028299:root'
  }),

  // S3
  createBucketMock: jest.fn().mockReturnValue('bucket-abc'),
  getBucketLocationMock: jest.fn().mockImplementation((params) => {
    // also covers integration tests bucket...
    if (params.Bucket === 'already-removed-bucket' || params.Bucket === 'deploy-bucket') {
      const error = new Error()
      error.code = 'NoSuchBucket'
      return Promise.reject(error)
    }
    return Promise.resolve()
  }),
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
  describeRule: jest.fn().mockImplementation((params) => {
    if (params.Name === 'already-removed-rule') {
      const error = new Error()
      error.code = 'ResourceNotFoundException'
      return Promise.reject(error)
    }
    return Promise.resolve({ ScheduleExpression: 'rate(6 minutes)', State: 'DISABLED' })
  }),
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
  publishLayerVersionMock: jest.fn().mockReturnValue({ LayerArn: 'abc:zxc' }),
  deleteLayerVersionMock: jest.fn().mockReturnValue(Promise.resolve({})),
  listLayerVersionsMock: jest.fn().mockReturnValue(Promise.resolve({ LayerVersions: [] })),

  // IAM
  createRoleMock: jest.fn().mockReturnValue({ Role: { Arn: 'arn:aws:iam::XXXXX:role/test-role' } }),
  getPolicyMock: jest.fn().mockImplementation((params) => {
    if (params.PolicyArn === 'arn:aws:iam::558750028299:policy/already-removed-policy') {
      const error = new Error()
      error.code = 'NoSuchEntity'
      return Promise.reject(error)
    }

    const res = {
      ResponseMetadata: { RequestId: '65e4b4a8-fd48-11y8-819e-a96de5c76b01' },
      Policy: {
        PolicyName: params.PolicyName,
        PolicyId: 'ANPAJNETMGAOTZZAKLZQM',
        Arn: `arn:aws:iam::558750028299:policy/some-policy-name`,
        Path: '/',
        DefaultVersionId: 'v1',
        AttachmentCount: 0,
        PermissionsBoundaryUsageCount: 0,
        IsAttachable: true
      }
    }

    return Promise.resolve(res)
  }),
  getPolicyVersionMock: jest.fn().mockImplementation((params) => {
    if (params.PolicyArn === 'arn:aws:iam::558750028299:policy/already-removed-policy') {
      const error = new Error()
      error.code = 'NoSuchEntity'
      return Promise.reject(error)
    }

    const res = {
      ResponseMetadata: { RequestId: '6661381d-fd48-11e8-9fad-b76520f2a049' },
      PolicyVersion: {
        Document:
          '%7B%22Version%22%3A%222012-10-17%22%2C%22Statement%22%3A%5B%7B%22Resource%22%3A%5B%22arn%3Aaws%3Adynamodb%3Aus-east-1%3A558750028299%3Atable%2FServerlessWebappUser-ServerlessWebApp-prod-hbrizf9d%22%5D%2C%22Effect%22%3A%22Allow%22%2C%22Action%22%3A%5B%22dynamodb%3AGetItem%22%2C%22dynamodb%3APutItem%22%2C%22dynamodb%3AUpdateItem%22%2C%22dynamodb%3ADeleteItem%22%5D%7D%5D%7D',
        VersionId: 'v1',
        IsDefaultVersion: true
      }
    }

    return Promise.resolve(res)
  }),
  listPolicyVersionsMock: jest.fn().mockImplementation(() => {
    const res = {
      ResponseMetadata: { RequestId: '3a16c546-fd8d-11e8-819e-a96de5c76b01' },
      Versions: [
        { VersionId: 'v3', IsDefaultVersion: true },
        { VersionId: 'v2', IsDefaultVersion: false },
        { VersionId: 'v1', IsDefaultVersion: false }
      ],
      IsTruncated: false
    }

    return Promise.resolve(res)
  }),
  deletePolicyVersionMock: jest.fn(),
  getRoleMock: jest.fn().mockImplementation((params) => {
    if (params.RoleName === 'already-removed-role') {
      const error = new Error()
      error.message = 'cannot be found'
      return Promise.reject(error)
    }

    const res = {
      ResponseMetadata: { RequestId: '8e3e8f8c-f491-11e8-90ae-8d96f5df2ad5' },
      Role: {
        Path: '/',
        RoleName: params.RoleName,
        RoleId: 'AROAJXU5XSYGHT6VNIEMG',
        Arn: `arn:aws:iam::xxx:role/${params.RoleName}`,
        CreateDate: 'somedate',
        AssumeRolePolicyDocument:
          '%7B%22Version%22%3A%222012-10-17%22%2C%22Statement%22%3A%5B%7B%22Effect%22%3A%22Allow%22%2C%22Principal%22%3A%7B%22Service%22%3A%22lambda.amazonaws.com%22%7D%2C%22Action%22%3A%22sts%3AAssumeRole%22%7D%5D%7D',
        Tags: [],
        MaxSessionDuration: 3600
      }
    }

    return Promise.resolve(res)
  }),
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
  }),
  describeTableMock: jest.fn().mockImplementation((params) => {
    if (params.TableName === 'already-removed-table') {
      const error = new Error()
      error.code = 'ResourceNotFoundException'
      return Promise.reject(error)
    }
    return Promise.resolve({
      Table: {
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S'
          }
        ],
        TableName: 'describe-table',
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH'
          }
        ],
        TableStatus: 'ACTIVE',
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        },
        TableArn: 'arn:aws:dynamodb:region:XXXXX:table/describe-table',
        LocalSecondaryIndexes: [
          {
            IndexName: 'local-index',
            KeySchema: [
              {
                AttributeName: 'id',
                KeyType: 'HASH'
              }
            ],
            Projection: {
              ProjectionType: 'ALL'
            }
          }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'global-index',
            KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5
            }
          }
        ],
        StreamSpecification: {
          StreamEnabled: true,
          StreamViewType: 'NEW_AND_OLD_IMAGES'
        },
        SSEDescription: {
          Status: 'ENABLED',
          SSEType: 'AES256',
          KMSMasterKeyArn: 'arn:aws:kms:region:XXXXX:master-key/key-id'
        }
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
    describeRule: (obj) => ({
      promise: () => mocks.describeRule(obj)
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
    getRole: (obj) => ({
      promise: () => mocks.getRoleMock(obj)
    }),
    getPolicy: (obj) => ({
      promise: () => mocks.getPolicyMock(obj)
    }),
    getPolicyVersion: (obj) => ({
      promise: () => mocks.getPolicyVersionMock(obj)
    }),
    listPolicyVersions: (obj) => ({
      promise: () => mocks.listPolicyVersionsMock(obj)
    }),
    deletePolicyVersion: (obj) => ({
      promise: () => mocks.deletePolicyVersionMock(obj)
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
    }),
    publishLayerVersion: (obj) => ({
      promise: () => mocks.publishLayerVersionMock(obj)
    }),
    deleteLayerVersion: (obj) => ({
      promise: () => mocks.deleteLayerVersionMock(obj)
    }),
    listLayerVersions: (obj) => ({
      promise: () => mocks.listLayerVersionsMock(obj)
    })
  }
}

const S3 = function() {
  return {
    createBucket: (obj) => ({
      promise: () => mocks.createBucketMock(obj)
    }),
    getBucketLocation: (obj) => ({
      promise: () => mocks.getBucketLocationMock(obj)
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
    }),
    describeTable: (obj) => ({
      promise: () => mocks.describeTableMock(obj)
    })
  }
}

const STS = function() {
  return {
    getCallerIdentity: (obj) => ({
      promise: () => mocks.getCallerIdentityMock(obj)
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
  DynamoDB,
  STS
}
