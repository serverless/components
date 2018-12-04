import AWS from 'aws-sdk'
import path from 'path'
import crypto from 'crypto'
import { sleep } from '@serverless/utils'
import {
  createContext,
  deserialize,
  resolveComponentEvaluables,
  serialize
} from '../../../src/utils'

jest.setTimeout(10000)

let context
let provider
let AwsIamRole

const createTestContext = async () =>
  createContext(
    {
      cwd: path.join(__dirname, '..'),
      overrides: {
        debug: () => {},
        log: () => {}
      }
    },
    {
      app: {
        id: 'test'
      }
    }
  )

jest.mock('@serverless/utils', () => ({
  ...require.requireActual('@serverless/utils'),
  sleep: jest.fn()
}))

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AwsIamRole', () => {
  beforeEach(async () => {
    context = await createTestContext()
    AwsIamRole = await context.import('./')

    const AwsProvider = await context.import('AwsProvider')
    provider = await context.construct(AwsProvider, {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'abc',
        secretAccessKey: 'xyz'
      }
    })
  })

  it('should throw if role name is greater than 64 characters', async () => {
    const roleName = crypto.randomBytes(33).toString('hex')

    const inputs = {
      roleName,
      service: 'lambda.amazonaws.com',
      provider,
      policy: {
        arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
      }
    }

    try {
      const awsIamRole = await context.construct(AwsIamRole, inputs)
      await context.defineComponent(awsIamRole)
      resolveComponentEvaluables(awsIamRole)
    } catch (error) {
      expect(error.message).toMatch('has invalid')
    }
  })

  it('should create role if first deployment', async () => {
    const inputs = {
      roleName: 'abc',
      service: 'lambda.amazonaws.com',
      provider,
      policy: {
        arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
      }
    }

    let awsIamRole = await context.construct(AwsIamRole, inputs)
    awsIamRole = await context.defineComponent(awsIamRole)
    awsIamRole = resolveComponentEvaluables(awsIamRole)

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

    expect(AWS.mocks.createRoleMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createRoleMock).toBeCalledWith(createRoleParams)
    expect(AWS.mocks.attachRolePolicyMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.attachRolePolicyMock).toBeCalledWith(attachRolePolicyParams)
    expect(awsIamRole.arn).toEqual('arn:aws:iam::XXXXX:role/test-role')
    expect(sleep).toBeCalledWith(15000)
  })

  it('should attach inline policy if specified', async () => {
    const inputs = {
      roleName: 'abc',
      service: 'lambda.amazonaws.com',
      provider,
      policy: {
        Version: '2012-10-17',
        Statement: {
          Action: ['*'],
          Resource: ['*'],
          Effect: 'Allow'
        }
      }
    }

    let awsIamRole = await context.construct(AwsIamRole, inputs)
    awsIamRole = await context.defineComponent(awsIamRole)
    awsIamRole = resolveComponentEvaluables(awsIamRole)

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

    const putRolePolicyParams = {
      RoleName: inputs.roleName,
      PolicyName: `${inputs.roleName}-policy`,
      PolicyDocument: JSON.stringify(inputs.policy)
    }

    expect(AWS.mocks.createRoleMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createRoleMock).toBeCalledWith(createRoleParams)
    expect(AWS.mocks.putRolePolicyMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.putRolePolicyMock).toBeCalledWith(putRolePolicyParams)
    expect(awsIamRole.arn).toEqual('arn:aws:iam::XXXXX:role/test-role')
    expect(sleep).toBeCalledWith(15000)
  })

  it('should update if role name has changed', async () => {
    let oldAwsIamRole = await context.construct(AwsIamRole, {
      roleName: 'old-role-name',
      service: 'lambda.amazonaws.com',
      policy: {
        arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
      },
      provider
    })
    oldAwsIamRole = await context.defineComponent(oldAwsIamRole)
    oldAwsIamRole = resolveComponentEvaluables(oldAwsIamRole)
    await oldAwsIamRole.deploy(null, context)

    const prevAwsIamRole = await deserialize(serialize(oldAwsIamRole, context), context)

    let newAwsIamRole = await context.construct(AwsIamRole, {
      roleName: 'new-role-name',
      service: 'lambda.amazonaws.com',
      policy: {
        arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
      },
      provider
    })
    newAwsIamRole = await context.defineComponent(newAwsIamRole)
    newAwsIamRole = resolveComponentEvaluables(newAwsIamRole)
    await newAwsIamRole.deploy(prevAwsIamRole, context)

    expect(AWS.mocks.createRoleMock).toBeCalledWith({
      AssumeRolePolicyDocument:
        '{"Version":"2012-10-17","Statement":{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}}',
      Path: '/',
      RoleName: 'new-role-name'
    })
  })

  it('should update service if changed', async () => {
    const inputs = {
      roleName: 'abc',
      service: 'apig.amazonaws.com',
      provider,
      policy: {
        arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
      }
    }

    let awsIamRole = await context.construct(AwsIamRole, inputs)
    awsIamRole = await context.defineComponent(awsIamRole)
    awsIamRole = resolveComponentEvaluables(awsIamRole)

    const prevInstance = {
      roleName: 'abc',
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

    expect(AWS.mocks.updateAssumeRolePolicyMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.updateAssumeRolePolicyMock).toBeCalledWith(updateAssumeRolePolicyParams)
  })

  it('should update policy if changed', async () => {
    const inputs = {
      roleName: 'abc',
      service: 'lambda.amazonaws.com',
      provider,
      policy: {
        arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
      }
    }

    let awsIamRole = await context.construct(AwsIamRole, inputs)
    awsIamRole = await context.defineComponent(awsIamRole)
    awsIamRole = resolveComponentEvaluables(awsIamRole)

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

    expect(AWS.mocks.attachRolePolicyMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.attachRolePolicyMock).toBeCalledWith(attachRolePolicyParams)
    expect(AWS.mocks.detachRolePolicyMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.detachRolePolicyMock).toBeCalledWith(detachRolePolicyParams)
    expect(sleep).toBeCalledWith(15000)
  })

  it('should preserve props if nothing changed', async () => {
    let awsIamRole = await context.construct(AwsIamRole, {
      provider,
      roleName: 'abc',
      service: 'lambda.amazonaws.com',
      policy: {
        arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
      }
    })

    awsIamRole = await context.defineComponent(awsIamRole)
    awsIamRole = resolveComponentEvaluables(awsIamRole)
    await awsIamRole.deploy(null, context)

    const prevAwsIamRole = await deserialize(serialize(awsIamRole, context), context)

    expect(prevAwsIamRole.arn).toBe('arn:aws:iam::XXXXX:role/test-role')

    let nextAwsIamRole = await context.construct(AwsIamRole, {
      provider,
      roleName: 'abc',
      service: 'lambda.amazonaws.com',
      policy: {
        arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
      }
    })
    nextAwsIamRole = await context.defineComponent(nextAwsIamRole, prevAwsIamRole)
    nextAwsIamRole = resolveComponentEvaluables(nextAwsIamRole)
    expect(nextAwsIamRole).toEqual(prevAwsIamRole)
  })

  it('should remove role', async () => {
    let oldAwsIamRole = await context.construct(AwsIamRole, {
      provider,
      roleName: 'abc',
      service: 'lambda.amazonaws.com',
      policy: {
        arn: 'arn:aws:iam::aws:policy/oldPolicy'
      }
    })
    oldAwsIamRole = await context.defineComponent(oldAwsIamRole)
    oldAwsIamRole = resolveComponentEvaluables(oldAwsIamRole)
    await oldAwsIamRole.deploy(null, context)

    const prevAwsIamRole = await deserialize(serialize(oldAwsIamRole, context), context)
    await prevAwsIamRole.remove(context)

    expect(AWS.mocks.deleteRoleMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteRoleMock).toBeCalledWith({
      RoleName: prevAwsIamRole.roleName
    })
    expect(AWS.mocks.detachRolePolicyMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.detachRolePolicyMock).toBeCalledWith({
      RoleName: prevAwsIamRole.roleName,
      PolicyArn: prevAwsIamRole.policy.arn
    })
  })

  it('should remove the role even if it does not exist anymore', async () => {
    let oldAwsIamRole = await context.construct(AwsIamRole, {
      provider,
      roleName: 'already-removed-role',
      service: 'lambda.amazonaws.com',
      policy: {
        arn: 'arn:aws:iam::aws:policy/oldPolicy'
      }
    })
    oldAwsIamRole = await context.defineComponent(oldAwsIamRole)
    oldAwsIamRole = resolveComponentEvaluables(oldAwsIamRole)
    await oldAwsIamRole.deploy(null, context)

    const prevAwsIamRole = await deserialize(serialize(oldAwsIamRole, context), context)
    await prevAwsIamRole.remove(context)

    expect(AWS.mocks.deleteRoleMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteRoleMock).toBeCalledWith({
      RoleName: prevAwsIamRole.roleName
    })
    expect(AWS.mocks.detachRolePolicyMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.detachRolePolicyMock).toBeCalledWith({
      RoleName: prevAwsIamRole.roleName,
      PolicyArn: prevAwsIamRole.policy.arn
    })
  })

  it('shouldDeploy should return undefined if nothing changed', async () => {
    let oldAwsIamRole = await context.construct(AwsIamRole, {
      provider,
      roleName: 'abc',
      service: 'lambda.amazonaws.com',
      policy: {
        arn: 'arn:aws:iam::aws:policy/oldPolicy'
      }
    })
    oldAwsIamRole = await context.defineComponent(oldAwsIamRole)
    oldAwsIamRole = resolveComponentEvaluables(oldAwsIamRole)
    await oldAwsIamRole.deploy(null, context)

    const prevAwsIamRole = await deserialize(serialize(oldAwsIamRole, context), context)

    let newAwsIamRole = await context.construct(AwsIamRole, {
      provider,
      roleName: 'abc',
      service: 'lambda.amazonaws.com',
      policy: {
        arn: 'arn:aws:iam::aws:policy/oldPolicy'
      }
    })
    newAwsIamRole = await context.defineComponent(newAwsIamRole)
    newAwsIamRole = resolveComponentEvaluables(newAwsIamRole)

    const res = newAwsIamRole.shouldDeploy(prevAwsIamRole)
    expect(res).toBe(undefined)
  })

  it('shouldDeploy should return replace if roleName changed', async () => {
    let oldAwsIamRole = await context.construct(AwsIamRole, {
      provider,
      roleName: 'abc',
      service: 'lambda.amazonaws.com',
      policy: {
        arn: 'arn:aws:iam::aws:policy/oldPolicy'
      }
    })
    oldAwsIamRole = await context.defineComponent(oldAwsIamRole)
    oldAwsIamRole = resolveComponentEvaluables(oldAwsIamRole)
    await oldAwsIamRole.deploy(null, context)

    const prevAwsIamRole = await deserialize(serialize(oldAwsIamRole, context), context)

    let newAwsIamRole = await context.construct(AwsIamRole, {
      provider,
      roleName: 'zxc', // changed
      service: 'lambda.amazonaws.com',
      policy: {
        arn: 'arn:aws:iam::aws:policy/oldPolicy'
      }
    })
    newAwsIamRole = await context.defineComponent(newAwsIamRole)
    newAwsIamRole = resolveComponentEvaluables(newAwsIamRole)

    const res = newAwsIamRole.shouldDeploy(prevAwsIamRole)
    expect(res).toBe('replace')
  })

  it('shouldDeploy should return deploy if config changed', async () => {
    let oldAwsIamRole = await context.construct(AwsIamRole, {
      provider,
      roleName: 'abc',
      service: 'lambda.amazonaws.com',
      policy: {
        arn: 'arn:aws:iam::aws:policy/oldPolicy'
      }
    })
    oldAwsIamRole = await context.defineComponent(oldAwsIamRole)
    oldAwsIamRole = resolveComponentEvaluables(oldAwsIamRole)
    await oldAwsIamRole.deploy(null, context)

    const prevAwsIamRole = await deserialize(serialize(oldAwsIamRole, context), context)

    let newAwsIamRole = await context.construct(AwsIamRole, {
      provider,
      roleName: 'abc',
      service: 'lambda.amazonaws.com',
      policy: {
        arn: 'arn:aws:iam::aws:policy/newPolicy' // changed
      }
    })
    newAwsIamRole = await context.defineComponent(newAwsIamRole)
    newAwsIamRole = resolveComponentEvaluables(newAwsIamRole)

    const res = newAwsIamRole.shouldDeploy(prevAwsIamRole)
    expect(res).toBe('deploy')
  })

  it('shouldDeploy should return deploy if first deployment', async () => {
    let oldAwsIamRole = await context.construct(AwsIamRole, {
      provider,
      roleName: 'already-removed-role',
      service: 'lambda.amazonaws.com',
      policy: {
        arn: 'arn:aws:iam::aws:policy/oldPolicy'
      }
    })
    oldAwsIamRole = await context.defineComponent(oldAwsIamRole)
    oldAwsIamRole = resolveComponentEvaluables(oldAwsIamRole)
    const res = oldAwsIamRole.shouldDeploy(null, context)
    expect(res).toBe('deploy')
  })

  it('sync should return "removed" if role removed from provider', async () => {
    let oldAwsIamRole = await context.construct(AwsIamRole, {
      provider,
      roleName: 'already-removed-role',
      service: 'lambda.amazonaws.com',
      policy: {
        arn: 'arn:aws:iam::aws:policy/oldPolicy'
      }
    })
    oldAwsIamRole = await context.defineComponent(oldAwsIamRole)
    oldAwsIamRole = resolveComponentEvaluables(oldAwsIamRole)
    const res = await oldAwsIamRole.sync(context)
    expect(res).toBe('removed')
  })

  it('sync should update role config if role config changed in provider', async () => {
    let oldAwsIamRole = await context.construct(AwsIamRole, {
      provider,
      roleName: 'somerole',
      service: 'elasticmapreduce.amazonaws.com', // this is outdated!
      policy: {
        arn: 'arn:aws:iam::aws:policy/oldPolicy'
      }
    })

    oldAwsIamRole = await context.defineComponent(oldAwsIamRole)
    oldAwsIamRole = resolveComponentEvaluables(oldAwsIamRole)
    const res = await oldAwsIamRole.sync(context)

    expect(res).toBe(undefined)
    expect(oldAwsIamRole.roleName).toBe('somerole')
    expect(oldAwsIamRole.service).toBe('lambda.amazonaws.com')
    expect(oldAwsIamRole.policy).toEqual({
      arn: 'arn:aws:iam::aws:policy/oldPolicy'
    })
  })
})
