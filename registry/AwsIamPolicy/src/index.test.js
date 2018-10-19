import AwsIamPolicy from './index'

// todo mock timers
jest.setTimeout(16000)

class SuperClass {
  constructor(inputs) {
    this.provider = inputs.provider
    this.policyName = inputs.policyName
    this.document = inputs.document
    this.arn = inputs.arn
  }
}

const SuperContext = {
  loadType: async () => {}
}

const mocks = {
  createPolicyMock: jest.fn().mockReturnValue({ Policy: { Arn: 'abc:xyz' } }),
  deletePolicyMock: jest.fn(),
  listEntitiesForPolicyMock: jest.fn().mockReturnValue({
    PolicyGroups: ['group'],
    PolicyRoles: ['role'],
    PolicyUsers: ['user']
  }),
  detachGroupPolicyMock: jest.fn(),
  detachRolePolicyMock: jest.fn(),
  detachUserPolicyMock: jest.fn()
}

const context = {
  get: () => {},
  log: () => {}
}

const provider = {
  getSdk: () => {
    return {
      IAM: function() {
        return {
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
          detachRolePolicy: (obj) => ({
            promise: () => mocks.detachRolePolicyMock(obj)
          }),
          detachUserPolicy: (obj) => ({
            promise: () => mocks.detachUserPolicyMock(obj)
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

describe('AwsIamPolicy', () => {
  it('should deploy policy', async () => {
    const inputs = {
      policyName: 'abc',
      document: {
        Version: '2012-10-17',
        Statement: {
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        }
      },
      provider
    }
    let awsIamPolicy = await AwsIamPolicy(SuperClass, SuperContext)
    awsIamPolicy = new awsIamPolicy(inputs, context)

    await awsIamPolicy.deploy(undefined, context)

    const createPolicyParams = {
      PolicyName: inputs.policyName,
      Path: '/',
      PolicyDocument: JSON.stringify(inputs.document)
    }

    expect(mocks.createPolicyMock).toHaveBeenCalledTimes(1)
    expect(mocks.createPolicyMock).toBeCalledWith(createPolicyParams)
    expect(awsIamPolicy.arn).toEqual('abc:xyz')
  })

  it('should remove policy', async () => {
    const prevInstance = {
      policyName: 'abc',
      arn: 'policy:arn',
      document: {
        Version: '2012-10-17',
        Statement: {
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        }
      },
      provider
    }
    let awsIamPolicy = await AwsIamPolicy(SuperClass, SuperContext)
    awsIamPolicy = new awsIamPolicy(prevInstance, context)

    await awsIamPolicy.remove(context)

    expect(mocks.deletePolicyMock).toHaveBeenCalledTimes(1)
    expect(mocks.deletePolicyMock).toBeCalledWith({
      PolicyArn: prevInstance.arn
    })

    expect(mocks.listEntitiesForPolicyMock).toHaveBeenCalledTimes(1)
    expect(mocks.listEntitiesForPolicyMock).toBeCalledWith({
      PolicyArn: prevInstance.arn
    })

    expect(mocks.detachGroupPolicyMock).toHaveBeenCalledTimes(1)
    expect(mocks.detachGroupPolicyMock).toBeCalledWith({ GroupName: 'group' })

    expect(mocks.detachRolePolicyMock).toHaveBeenCalledTimes(1)
    expect(mocks.detachRolePolicyMock).toBeCalledWith({ RoleName: 'role' })

    expect(mocks.detachUserPolicyMock).toHaveBeenCalledTimes(1)
    expect(mocks.detachUserPolicyMock).toBeCalledWith({ UserName: 'user' })
  })
})
