import AWS from 'aws-sdk'
import path from 'path'
import { deserialize, serialize, resolveComponentEvaluables } from '../../../src/utils'
import { createTestContext } from '../../../test'

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AwsCloudWatchEventsRule', () => {
  const cwd = path.join(__dirname, '..')
  let context
  let provider
  let AwsProvider
  let AwsCloudWatchEventsRule

  beforeEach(async () => {
    context = await createTestContext({ cwd })
    AwsProvider = await context.import('AwsProvider')
    AwsCloudWatchEventsRule = await context.import('./')
    provider = await context.construct(AwsProvider, {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'abc',
        secretAccessKey: 'xyz'
      }
    })
  })

  it('should create schedule', async () => {
    const putRuleParams = {
      Name: 'hello',
      ScheduleExpression: 'rate(5 minutes)',
      State: 'ENABLED'
    }
    const inputs = {
      provider,
      enabled: true,
      schedule: 'rate(5 minutes)',
      lambda: {
        functionName: putRuleParams.Name,
        getId: () => 'arn:aws:lambda:us-east-1:1234567890:function:hello'
      }
    }

    let awsCloudWatchEventsRule = await context.construct(AwsCloudWatchEventsRule, inputs)
    awsCloudWatchEventsRule = await context.defineComponent(awsCloudWatchEventsRule)
    awsCloudWatchEventsRule = resolveComponentEvaluables(awsCloudWatchEventsRule)

    await awsCloudWatchEventsRule.deploy(null, context)

    const putTargetsParams = {
      Rule: 'hello',
      Targets: [
        {
          Arn: 'arn:aws:lambda:us-east-1:1234567890:function:hello',
          Id: 'hello'
        }
      ]
    }

    const addPermissionParams = {
      Action: 'lambda:InvokeFunction',
      FunctionName: 'hello',
      StatementId: 'hello-cron',
      Principal: 'events.amazonaws.com'
    }

    expect(awsCloudWatchEventsRule.arn).toEqual('abc:zxc')
    expect(AWS.mocks.putRule).toBeCalledWith(putRuleParams)
    expect(AWS.mocks.putTargets).toBeCalledWith(putTargetsParams)
    expect(AWS.mocks.addPermission).toBeCalledWith(addPermissionParams)
  })

  it('should preserve props if nothing changed', async () => {
    let awsCloudWatchEventsRule = await context.construct(AwsCloudWatchEventsRule, {
      provider,
      schedule: 'rate(5 minutes)',
      lambda: {
        functionName: 'hello',
        getId: () => 'arn:aws:lambda:us-east-1:1234567890:function:hello'
      }
    })

    awsCloudWatchEventsRule = await context.defineComponent(awsCloudWatchEventsRule)
    awsCloudWatchEventsRule = resolveComponentEvaluables(awsCloudWatchEventsRule)
    await awsCloudWatchEventsRule.deploy(null, context)

    const prevAwsEventsRule = await deserialize(
      serialize(awsCloudWatchEventsRule, context),
      context
    )

    expect(prevAwsEventsRule.arn).toBe('abc:zxc')

    let nextAwsEventsRule = await context.construct(AwsCloudWatchEventsRule, {
      provider,
      schedule: 'rate(5 minutes)',
      lambda: {
        functionName: 'hello',
        getId: () => 'arn:aws:lambda:us-east-1:1234567890:function:hello'
      }
    })
    nextAwsEventsRule = await context.defineComponent(nextAwsEventsRule, prevAwsEventsRule)
    nextAwsEventsRule = resolveComponentEvaluables(nextAwsEventsRule)
    // remove the getId function to ease equality checks
    delete nextAwsEventsRule.inputs.lambda.getId
    delete prevAwsEventsRule.inputs.lambda.getId
    expect(nextAwsEventsRule).toEqual(prevAwsEventsRule)
  })

  it('should remove schedule', async () => {
    const deleteRuleParams = {
      Name: 'hello'
    }
    const inputs = {
      provider,
      enabled: true,
      schedule: 'rate(5 minutes)',
      lambda: {
        functionName: deleteRuleParams.Name,
        getId: () => 'arn:aws:lambda:us-east-1:1234567890:function:hello'
      }
    }

    let awsCloudWatchEventsRule = await context.construct(AwsCloudWatchEventsRule, inputs)
    awsCloudWatchEventsRule = await context.defineComponent(awsCloudWatchEventsRule)
    awsCloudWatchEventsRule = resolveComponentEvaluables(awsCloudWatchEventsRule)
    await awsCloudWatchEventsRule.remove(context)

    const removeTargetsParams = {
      Rule: 'hello',
      Ids: ['hello']
    }

    expect(AWS.mocks.removeTargets).toBeCalledWith(removeTargetsParams)
    expect(AWS.mocks.deleteRule).toBeCalledWith(deleteRuleParams)
  })

  it('should remove schedule even if the rule does not exist anymore', async () => {
    const deleteRuleParams = {
      Name: 'already-removed-rule'
    }
    const inputs = {
      provider,
      enabled: true,
      schedule: 'rate(5 minutes)',
      lambda: {
        functionName: deleteRuleParams.Name,
        getId: () => 'arn:aws:lambda:us-east-1:1234567890:function:hello'
      }
    }

    let awsCloudWatchEventsRule = await context.construct(AwsCloudWatchEventsRule, inputs)
    awsCloudWatchEventsRule = await context.defineComponent(awsCloudWatchEventsRule)
    awsCloudWatchEventsRule = resolveComponentEvaluables(awsCloudWatchEventsRule)
    await awsCloudWatchEventsRule.remove(context)

    const removeTargetsParams = {
      Rule: 'already-removed-rule',
      Ids: ['already-removed-rule']
    }

    expect(AWS.mocks.removeTargets).toBeCalledWith(removeTargetsParams)
    expect(AWS.mocks.deleteRule).toBeCalledWith(deleteRuleParams)
  })

  it('sync should return "removed" if rule removed from provider', async () => {
    let awsCloudWatchEventsRule = await context.construct(AwsCloudWatchEventsRule, {
      provider,
      enabled: true,
      schedule: 'rate(5 minutes)',
      lambda: {
        functionName: 'already-removed-rule',
        getId: () => 'arn:aws:lambda:us-east-1:1234567890:function:already-removed-rule'
      }
    })
    awsCloudWatchEventsRule = await context.defineComponent(awsCloudWatchEventsRule)
    awsCloudWatchEventsRule = resolveComponentEvaluables(awsCloudWatchEventsRule)
    const res = await awsCloudWatchEventsRule.sync(context)
    expect(res).toBe('removed')
  })

  it('sync should update rule config if rule config changed in provider', async () => {
    let awsCloudWatchEventsRule = await context.construct(AwsCloudWatchEventsRule, {
      provider,
      enabled: true,
      schedule: 'rate(5 minutes)',
      lambda: {
        functionName: 'some-rule-name',
        getId: () => 'arn:aws:lambda:us-east-1:1234567890:function:hello'
      }
    })
    awsCloudWatchEventsRule = await context.defineComponent(awsCloudWatchEventsRule)
    awsCloudWatchEventsRule = resolveComponentEvaluables(awsCloudWatchEventsRule)
    await awsCloudWatchEventsRule.sync(context)
    expect(awsCloudWatchEventsRule.enabled).toBe(false)
    expect(awsCloudWatchEventsRule.schedule).toBe('rate(6 minutes)')
  })
})
