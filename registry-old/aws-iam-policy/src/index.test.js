const AWS = require('aws-sdk') // eslint-disable-line
const BbPromise = require('bluebird') // eslint-disable-line
const iamComponent = require('./index')

jest.mock('bluebird', () => ({
  delay: jest.fn(() => Promise.resolve())
}))

jest.mock('aws-sdk', () => {
  const mocks = {
    createPolicyMock: jest.fn().mockReturnValue({ Policy: { Arn: 'abc:xyz' } }),
    detachGroupPolicyMock: jest.fn().mockReturnValue({}),
    detachRolePolicyMock: jest.fn().mockReturnValue({}),
    detachUserPolicyMock: jest.fn().mockReturnValue({}),
    listEntitiesForPolicyMock: jest.fn().mockReturnValue({
      PolicyGroups: [
        {
          GroupName: 'Admins'
        }
      ],
      PolicyUsers: [
        {
          UserName: 'Bob'
        }
      ],
      PolicyRoles: [
        {
          RoleName: 'testRole'
        }
      ],
      IsTruncated: false
    }),
    deletePolicyMock: jest.fn().mockImplementation((params) => {
      if (params.PolicyArn === 'abc:deleted') {
        return Promise.reject(new Error('does not exist or is not attachable'))
      } else if (params.PolicyArn === 'abc:other-error') {
        return Promise.reject(new Error('other-error'))
      }
      return Promise.resolve({ Role: { Arn: null } })
    })
  }

  const IAM = {
    createPolicy: (obj) => ({
      promise: () => mocks.createPolicyMock(obj)
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
    }),
    deletePolicy: (obj) => ({
      promise: () => mocks.deletePolicyMock(obj)
    })
  }
  return {
    mocks,
    IAM: jest.fn().mockImplementation(() => IAM)
  }
})

afterEach(() => {
  AWS.mocks.createPolicyMock.mockClear()
  AWS.mocks.listEntitiesForPolicyMock.mockClear()
  AWS.mocks.detachGroupPolicyMock.mockClear()
  AWS.mocks.detachRolePolicyMock.mockClear()
  AWS.mocks.detachUserPolicyMock.mockClear()
  AWS.mocks.deletePolicyMock.mockClear()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('IAM Policy Unit Tests', () => {
  it('should deploy iam policy', async () => {
    const iamContextMock = {
      state: {},
      archive: {},
      log: () => {},
      saveState: () => {}
    }

    const inputs = {
      name: 'some-policy',
      policy: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:*'],
            Resource: ['*']
          }
        ]
      }
    }

    const outputs = await iamComponent.deploy(inputs, iamContextMock)

    expect(AWS.IAM).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createPolicyMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deletePolicyMock).toHaveBeenCalledTimes(0)
    expect(outputs.arn).toEqual('abc:xyz')
  })

  it('should rename iam policy', async () => {
    const iamContextMock = {
      state: {
        name: 'some-policy',
        arn: 'abc:xyz',
        policy: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['logs:*'],
              Resource: ['*']
            }
          ]
        }
      },
      archive: {},
      log: () => {},
      saveState: () => {}
    }

    const inputs = {
      name: 'some-other-policy',
      policy: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:*'],
            Resource: ['*']
          }
        ]
      }
    }

    const outputs = await iamComponent.deploy(inputs, iamContextMock)

    expect(AWS.IAM).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createPolicyMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deletePolicyMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toEqual('abc:xyz')
  })

  it('should ignore iam policy deployment when no state name and inputs name', async () => {
    const iamContextMock = {
      state: {
        arn: 'abc:xyz',
        policy: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['logs:*'],
              Resource: ['*']
            }
          ]
        }
      },
      archive: {},
      log: () => {},
      saveState: () => {}
    }

    const inputs = {
      policy: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:*'],
            Resource: ['*']
          }
        ]
      }
    }

    const outputs = await iamComponent.deploy(inputs, iamContextMock)

    expect(AWS.IAM).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createPolicyMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deletePolicyMock).toHaveBeenCalledTimes(0)
    expect(outputs.arn).toEqual('abc:xyz')
  })

  it('should delete iam policy without name', async () => {
    const iamContextMock = {
      state: {
        name: 'some-policy',
        arn: 'abc:xyz',
        policy: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['logs:*'],
              Resource: ['*']
            }
          ]
        }
      },
      archive: {},
      log: () => {},
      saveState: () => {}
    }

    const inputs = {
      policy: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:*'],
            Resource: ['*']
          }
        ]
      }
    }

    const outputs = await iamComponent.deploy(inputs, iamContextMock)

    expect(AWS.IAM).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createPolicyMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deletePolicyMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toBeNull()
  })

  it('should delete iam policy', async () => {
    const iamContextMock = {
      state: {
        name: 'some-policy',
        arn: 'abc:deleted',
        policy: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['logs:*'],
              Resource: ['*']
            }
          ]
        }
      },
      archive: {},
      log: () => {},
      saveState: () => {}
    }

    const inputs = {
      name: 'some-policy',
      policy: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:*'],
            Resource: ['*']
          }
        ]
      }
    }

    const outputs = await iamComponent.remove(inputs, iamContextMock)

    expect(AWS.IAM).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createPolicyMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deletePolicyMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toBeUndefined()
  })

  it('should throw error when error is not "exist or is not attachable" error', async () => {
    const iamContextMock = {
      state: {
        name: 'some-policy',
        arn: 'abc:other-error',
        policy: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['logs:*'],
              Resource: ['*']
            }
          ]
        }
      },
      archive: {},
      log: () => {},
      saveState: () => {}
    }

    const inputs = {
      name: 'some-policy',
      policy: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:*'],
            Resource: ['*']
          }
        ]
      }
    }

    let outputs

    try {
      outputs = await iamComponent.remove(inputs, iamContextMock)
    } catch (error) {
      expect(error.message).toBe('Error: other-error')
    }
    expect(AWS.IAM).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createPolicyMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deletePolicyMock).toHaveBeenCalledTimes(1)
    expect(outputs).toBeUndefined()
  })

  it('should not delete with empty state', async () => {
    const iamContextMock = {
      state: {},
      archive: {},
      log: () => {},
      saveState: () => {}
    }

    const inputs = {}

    const outputs = await iamComponent.remove(inputs, iamContextMock)

    expect(AWS.IAM).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createPolicyMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deletePolicyMock).toHaveBeenCalledTimes(0)
    expect(outputs.arn).toBeUndefined()
  })
})
