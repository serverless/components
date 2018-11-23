import AWS from 'aws-sdk'
import path from 'path'
import { sleep } from '@serverless/utils'
import {
  createContext,
  deserialize,
  resolveComponentEvaluables,
  serialize
} from '../../../src/utils'

let context
let provider
let AwsIamPolicy

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

describe('AwsIamPolicy', () => {
  beforeEach(async () => {
    context = await createTestContext()
    AwsIamPolicy = await context.import('./')

    const AwsProvider = await context.import('AwsProvider')
    provider = await context.construct(AwsProvider, {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'abc',
        secretAccessKey: 'xyz'
      }
    })
  })

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

    let awsIamPolicy = await context.construct(AwsIamPolicy, inputs)
    awsIamPolicy = await context.defineComponent(awsIamPolicy)
    awsIamPolicy = resolveComponentEvaluables(awsIamPolicy)

    await awsIamPolicy.deploy(null, context)

    const createPolicyParams = {
      PolicyName: inputs.policyName,
      Path: '/',
      PolicyDocument: JSON.stringify(inputs.document)
    }

    expect(AWS.mocks.createPolicyMock).toBeCalledWith(createPolicyParams)
    expect(awsIamPolicy.arn).toEqual('abc:xyz')
    expect(sleep).toBeCalledWith(15000)
  })

  it('should remove policy', async () => {
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
    let oldAwsIamPolicy = await context.construct(AwsIamPolicy, inputs)
    oldAwsIamPolicy = await context.defineComponent(oldAwsIamPolicy)
    oldAwsIamPolicy = resolveComponentEvaluables(oldAwsIamPolicy)
    await oldAwsIamPolicy.deploy(null, context)

    const prevAwsIamPolicy = await deserialize(serialize(oldAwsIamPolicy, context), context)
    prevAwsIamPolicy.arn = 'abc:zxc'
    await prevAwsIamPolicy.remove(context)

    expect(AWS.mocks.deletePolicyMock).toBeCalledWith({
      PolicyArn: prevAwsIamPolicy.arn
    })
    expect(AWS.mocks.listEntitiesForPolicyMock).toBeCalledWith({
      PolicyArn: prevAwsIamPolicy.arn
    })
    expect(AWS.mocks.detachGroupPolicyMock).toBeCalledWith({
      GroupName: 'group',
      PolicyArn: prevAwsIamPolicy.arn
    })
    expect(AWS.mocks.detachRolePolicyMock).toBeCalledWith({
      RoleName: 'role',
      PolicyArn: prevAwsIamPolicy.arn
    })
    expect(AWS.mocks.detachUserPolicyMock).toBeCalledWith({
      UserName: 'user',
      PolicyArn: prevAwsIamPolicy.arn
    })
  })

  it('should remove policy even if it does not exist anymore', async () => {
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
    let oldAwsIamPolicy = await context.construct(AwsIamPolicy, inputs)
    oldAwsIamPolicy = await context.defineComponent(oldAwsIamPolicy)
    oldAwsIamPolicy = resolveComponentEvaluables(oldAwsIamPolicy)
    await oldAwsIamPolicy.deploy(null, context)

    const prevAwsIamPolicy = await deserialize(serialize(oldAwsIamPolicy, context), context)
    prevAwsIamPolicy.arn = 'already-removed-policy'
    await prevAwsIamPolicy.remove(context)

    expect(AWS.mocks.deletePolicyMock).toBeCalledWith({
      PolicyArn: prevAwsIamPolicy.arn
    })
    expect(AWS.mocks.listEntitiesForPolicyMock).toBeCalledWith({
      PolicyArn: prevAwsIamPolicy.arn
    })
    expect(AWS.mocks.detachGroupPolicyMock).toBeCalledWith({
      GroupName: 'group',
      PolicyArn: prevAwsIamPolicy.arn
    })
    expect(AWS.mocks.detachRolePolicyMock).toBeCalledWith({
      RoleName: 'role',
      PolicyArn: prevAwsIamPolicy.arn
    })
    expect(AWS.mocks.detachUserPolicyMock).toBeCalledWith({
      UserName: 'user',
      PolicyArn: prevAwsIamPolicy.arn
    })
  })

  it('should preserve props if nothing changed', async () => {
    let awsIamPolicy = await context.construct(AwsIamPolicy, {
      provider,
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
      }
    })

    awsIamPolicy = await context.defineComponent(awsIamPolicy)
    awsIamPolicy = resolveComponentEvaluables(awsIamPolicy)
    await awsIamPolicy.deploy(null, context)

    const prevAwsIamPolicy = await deserialize(serialize(awsIamPolicy, context), context)

    expect(prevAwsIamPolicy.arn).toBe('abc:xyz')

    let nextAwsIamPolicy = await context.construct(AwsIamPolicy, {
      provider,
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
      }
    })
    nextAwsIamPolicy = await context.defineComponent(nextAwsIamPolicy, prevAwsIamPolicy)
    nextAwsIamPolicy = resolveComponentEvaluables(nextAwsIamPolicy)
    expect(nextAwsIamPolicy).toEqual(prevAwsIamPolicy)
  })

  it('shouldDeploy should return undefined if nothing changed', async () => {
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
    let oldAwsIamPolicy = await context.construct(AwsIamPolicy, inputs)
    oldAwsIamPolicy = await context.defineComponent(oldAwsIamPolicy)
    oldAwsIamPolicy = resolveComponentEvaluables(oldAwsIamPolicy)
    await oldAwsIamPolicy.deploy(null, context)

    const prevAwsIamPolicy = await deserialize(serialize(oldAwsIamPolicy, context), context)

    let newAwsIamPolicy = await context.construct(AwsIamPolicy, inputs)
    newAwsIamPolicy = await context.defineComponent(newAwsIamPolicy)
    newAwsIamPolicy = resolveComponentEvaluables(newAwsIamPolicy)

    const res = newAwsIamPolicy.shouldDeploy(prevAwsIamPolicy)
    expect(res).toBe(undefined)
  })

  it('shouldDeploy should return replace if policyName changed', async () => {
    let oldAwsIamPolicy = await context.construct(AwsIamPolicy, {
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
    })
    oldAwsIamPolicy = await context.defineComponent(oldAwsIamPolicy)
    oldAwsIamPolicy = resolveComponentEvaluables(oldAwsIamPolicy)
    await oldAwsIamPolicy.deploy(null, context)

    const prevAwsIamPolicy = await deserialize(serialize(oldAwsIamPolicy, context), context)

    let newAwsIamPolicy = await context.construct(AwsIamPolicy, {
      policyName: 'zxc', // changed
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
    })
    newAwsIamPolicy = await context.defineComponent(newAwsIamPolicy)
    newAwsIamPolicy = resolveComponentEvaluables(newAwsIamPolicy)

    const res = newAwsIamPolicy.shouldDeploy(prevAwsIamPolicy)
    expect(res).toBe('replace')
  })

  it('shouldDeploy should throw error if config changed but name was not changed', async () => {
    let oldAwsIamPolicy = await context.construct(AwsIamPolicy, {
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
    })
    oldAwsIamPolicy = await context.defineComponent(oldAwsIamPolicy)
    oldAwsIamPolicy = resolveComponentEvaluables(oldAwsIamPolicy)
    await oldAwsIamPolicy.deploy(null, context)

    const prevAwsIamPolicy = await deserialize(serialize(oldAwsIamPolicy, context), context)

    let newAwsIamPolicy = await context.construct(AwsIamPolicy, {
      policyName: 'abc',
      document: {
        Version: '2012-10-17',
        Statement: {
          Effect: 'Allow',
          Principal: {
            Service: 'apig.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        }
      },
      provider
    })
    newAwsIamPolicy = await context.defineComponent(newAwsIamPolicy)
    newAwsIamPolicy = resolveComponentEvaluables(newAwsIamPolicy)

    expect(() => newAwsIamPolicy.shouldDeploy(prevAwsIamPolicy)).toThrow(
      'Deployed policies cannot be updated'
    )
  })

  it('shouldDeploy should change name if config changed when using default name', async () => {
    let oldAwsIamPolicy = await context.construct(AwsIamPolicy, {
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
    })
    oldAwsIamPolicy = await context.defineComponent(oldAwsIamPolicy)
    oldAwsIamPolicy = resolveComponentEvaluables(oldAwsIamPolicy)
    await oldAwsIamPolicy.deploy(null, context)

    const prevAwsIamPolicy = await deserialize(serialize(oldAwsIamPolicy, context), context)

    let newAwsIamPolicy = await context.construct(AwsIamPolicy, {
      document: {
        Version: '2012-10-17',
        Statement: {
          Effect: 'Allow',
          Principal: {
            Service: 'apig.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        }
      },
      provider
    })
    newAwsIamPolicy = await context.defineComponent(newAwsIamPolicy, oldAwsIamPolicy)
    newAwsIamPolicy = resolveComponentEvaluables(newAwsIamPolicy)

    newAwsIamPolicy.shouldDeploy(prevAwsIamPolicy)

    expect(newAwsIamPolicy.policyName).not.toEqual(`policy-${newAwsIamPolicy.instanceId}`)
  })

  it('shouldDeploy should return deploy if first deployment', async () => {
    let oldAwsIamPolicy = await context.construct(AwsIamPolicy, {
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
    })
    oldAwsIamPolicy = await context.defineComponent(oldAwsIamPolicy)
    oldAwsIamPolicy = resolveComponentEvaluables(oldAwsIamPolicy)
    const res = oldAwsIamPolicy.shouldDeploy(null, context)
    expect(res).toBe('deploy')
  })
})
