import AwsIamRole from './index'

// todo mock timers
jest.setTimeout(16000)

class SuperClass {
  constructor(inputs) {
    this.provider = inputs.provider
    this.roleName = inputs.roleName
    this.service = inputs.service
    this.policy = inputs.policy
  }
}

const SuperContext = {
  loadType: async () => {}
}

const mocks = {
  createRoleMock: jest.fn().mockReturnValue({ Role: { Arn: 'abc:xyz' } }),
  deleteRoleMock: jest.fn().mockImplementation((params) => {
    if (params.RoleName === 'some-already-removed-role') {
      return Promise.reject(new Error('Role not found'))
    }
    return Promise.resolve({ Role: { Arn: null } })
  }),
  attachRolePolicyMock: jest.fn(),
  detachRolePolicyMock: jest.fn(),
  updateAssumeRolePolicyMock: jest.fn()
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

describe('AwsIamRole', () => {
  it('should create role if first deployment', async () => {
    const inputs = {
      roleName: 'abc',
      service: 'lambda.amazonaws.com',
      provider
    }
    let awsIamRole = await AwsIamRole(SuperClass, SuperContext)
    awsIamRole = new awsIamRole(inputs, context)

    await awsIamRole.deploy(undefined, context)

    const createRoleParams = {
      RoleName: inputs.roleName,
      Path: '/',
      AssumeRolePolicyDocument: JSON.stringify({
        Version: '2012-10-17',
        Statement: {
          Effect: 'Allow',
          Principal: {
            Service: inputs.service
          },
          Action: 'sts:AssumeRole'
        }
      })
    }

    const attachRolePolicyParams = {
      RoleName: inputs.roleName,
      PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess'
    }

    expect(mocks.createRoleMock).toHaveBeenCalledTimes(1)
    expect(mocks.createRoleMock).toBeCalledWith(createRoleParams)
    expect(mocks.attachRolePolicyMock).toHaveBeenCalledTimes(1)
    expect(mocks.attachRolePolicyMock).toBeCalledWith(attachRolePolicyParams)
    expect(awsIamRole.arn).toEqual('abc:xyz')
  })

  it('should update service if changed', async () => {
    const inputs = {
      roleName: 'abc',
      service: 'apig.amazonaws.com',
      provider
    }
    let awsIamRole = await AwsIamRole(SuperClass, SuperContext)
    awsIamRole = new awsIamRole(inputs, context)

    const prevInstance = {
      service: 'lambda.amazonaws.com',
      policy: {
        arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
      }
    }

    const updateAssumeRolePolicyParams = {
      RoleName: inputs.roleName,
      PolicyDocument: JSON.stringify({
        Version: '2012-10-17',
        Statement: {
          Effect: 'Allow',
          Principal: {
            Service: inputs.service
          },
          Action: 'sts:AssumeRole'
        }
      })
    }

    await awsIamRole.deploy(prevInstance, context)

    expect(mocks.updateAssumeRolePolicyMock).toHaveBeenCalledTimes(1)
    expect(mocks.updateAssumeRolePolicyMock).toBeCalledWith(updateAssumeRolePolicyParams)
  })

  it('should update policy if changed', async () => {
    const inputs = {
      roleName: 'abc',
      service: 'lambda.amazonaws.com',
      provider
    }
    let awsIamRole = await AwsIamRole(SuperClass, SuperContext)
    awsIamRole = new awsIamRole(inputs, context)

    const prevInstance = {
      roleName: 'abc',
      service: 'lambda.amazonaws.com',
      policy: {
        arn: 'arn:aws:iam::aws:policy/oldPolicy'
      }
    }

    const attachRolePolicyParams = {
      RoleName: inputs.roleName,
      PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess'
    }

    const detachRolePolicyParams = {
      RoleName: inputs.roleName,
      PolicyArn: prevInstance.policy.arn
    }

    await awsIamRole.deploy(prevInstance, context)

    expect(mocks.attachRolePolicyMock).toHaveBeenCalledTimes(1)
    expect(mocks.attachRolePolicyMock).toBeCalledWith(attachRolePolicyParams)
    expect(mocks.detachRolePolicyMock).toHaveBeenCalledTimes(1)
    expect(mocks.detachRolePolicyMock).toBeCalledWith(detachRolePolicyParams)
  })

  it('should remove role', async () => {
    const prevInstance = {
      provider,
      roleName: 'abc',
      service: 'lambda.amazonaws.com',
      policy: {
        arn: 'arn:aws:iam::aws:policy/oldPolicy'
      }
    }
    let awsIamRole = await AwsIamRole(SuperClass, SuperContext)
    awsIamRole = new awsIamRole(prevInstance, context)

    const deleteRoleParams = {
      RoleName: prevInstance.roleName
    }

    const detachRolePolicyParams = {
      RoleName: prevInstance.roleName,
      PolicyArn: prevInstance.policy.arn
    }

    await awsIamRole.remove(context)

    expect(mocks.deleteRoleMock).toHaveBeenCalledTimes(1)
    expect(mocks.deleteRoleMock).toBeCalledWith(deleteRoleParams)
    expect(mocks.detachRolePolicyMock).toHaveBeenCalledTimes(1)
    expect(mocks.detachRolePolicyMock).toBeCalledWith(detachRolePolicyParams)
  })
})
