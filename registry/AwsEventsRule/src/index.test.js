import path from 'path'
import { createContext, resolveComponentEvaluables } from '../../../src/utils'
import AWS from 'aws-sdk'

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

describe('AwsEventsRule', () => {
  it('should create schedule', async () => {
    const context = await createTestContext()
    const AwsProvider = await context.loadType('AwsProvider')
    const AwsEventsRule = await context.loadType('./')

    const putRuleParams = {
      Name: 'hello',
      ScheduleExpression: 'rate(5 minutes)',
      State: 'ENABLED'
    }
    const inputs = {
      provider: await context.construct(AwsProvider, {}),
      enabled: true,
      schedule: 'rate(5 minutes)',
      lambda: {
        functionName: putRuleParams.Name,
        getId: () => 'arn:aws:lambda:us-east-1:1234567890:function:hello'
      }
    }

    let awsEventsRule = await context.construct(AwsEventsRule, inputs)
    awsEventsRule = await context.defineComponent(awsEventsRule)
    awsEventsRule = resolveComponentEvaluables(awsEventsRule)

    await awsEventsRule.deploy(null, context)

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
      StatementId: 'hello',
      Principal: 'events.amazonaws.com'
    }

    expect(awsEventsRule.arn).toEqual('abc:zxc')
    expect(AWS.mocks.putRule).toBeCalledWith(putRuleParams)
    expect(AWS.mocks.putTargets).toBeCalledWith(putTargetsParams)
    expect(AWS.mocks.addPermission).toBeCalledWith(addPermissionParams)
  })

  it('should remove schedule', async () => {
    const context = await createTestContext()
    const AwsProvider = await context.loadType('AwsProvider')
    const AwsEventsRule = await context.loadType('./')

    const deleteRuleParams = {
      Name: 'hello'
    }
    const inputs = {
      provider: await context.construct(AwsProvider, {}),
      enabled: true,
      schedule: 'rate(5 minutes)',
      lambda: {
        functionName: deleteRuleParams.Name,
        getId: () => 'arn:aws:lambda:us-east-1:1234567890:function:hello'
      }
    }

    let awsEventsRule = await context.construct(AwsEventsRule, inputs)
    awsEventsRule = await context.defineComponent(awsEventsRule)
    awsEventsRule = resolveComponentEvaluables(awsEventsRule)
    await awsEventsRule.remove(context)

    const removeTargetsParams = {
      Rule: 'hello',
      Ids: ['hello']
    }

    expect(AWS.mocks.removeTargets).toBeCalledWith(removeTargetsParams)
    expect(AWS.mocks.deleteRule).toBeCalledWith(deleteRuleParams)
  })
})
