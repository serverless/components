import path from 'path'
import { createContext } from '../../../src/utils'

const mocks = {
  putRuleMock: jest.fn().mockReturnValue({ RuleArn: 'abc:zxc' }),
  putTargetsMock: jest.fn(),
  removeTargetsMock: jest.fn(),
  putTargetsMock: jest.fn(),
  deleteRuleMock: jest.fn(),
  addPermissionMock: jest.fn()
}

const provider = {
  getSdk: () => {
    return {
      Lambda: function() {
        return {
          addPermission: (obj) => ({
            promise: () => mocks.addPermissionMock(obj)
          })
        }
      },
      CloudWatchEvents: function() {
        return {
          putRule: (obj) => ({
            promise: () => mocks.putRuleMock(obj)
          }),
          putTargets: (obj) => ({
            promise: () => mocks.putTargetsMock(obj)
          }),
          removeTargets: (obj) => ({
            promise: () => mocks.removeTargetsMock(obj)
          }),
          deleteRule: (obj) => ({
            promise: () => mocks.deleteRuleMock(obj)
          })
        }
      }
    }
  }
}

describe('AwsEventsRule', () => {
  it('should create schedule', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const inputs = {
      provider,
      enabled: true,
      schedule: 'rate(5 minutes)',
      lambda: {
        getId: () => 'arn:aws:lambda:us-east-1:1234567890:function:hello'
      }
    }

    const AwsEventsRule = await context.loadType('./')
    const awsEventsRule = await context.construct(AwsEventsRule, inputs)

    await awsEventsRule.deploy(undefined, context)

    const putRuleParams = {
      Name: 'hello',
      ScheduleExpression: 'rate(5 minutes)',
      State: 'ENABLED'
    }

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
    expect(mocks.putRuleMock).toBeCalledWith(putRuleParams)
    expect(mocks.putTargetsMock).toBeCalledWith(putTargetsParams)
    expect(mocks.addPermissionMock).toBeCalledWith(addPermissionParams)
  })

  it('should remove schedule', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const inputs = {
      provider,
      enabled: true,
      schedule: 'rate(5 minutes)',
      lambda: {
        getId: () => 'arn:aws:lambda:us-east-1:1234567890:function:hello'
      }
    }

    const AwsEventsRule = await context.loadType('./')
    const awsEventsRule = await context.construct(AwsEventsRule, inputs)

    await awsEventsRule.remove(context)

    const removeTargetsParams = {
      Rule: 'hello',
      Ids: ['hello']
    }

    const deleteRuleParams = {
      Name: 'hello'
    }

    expect(mocks.removeTargetsMock).toBeCalledWith(removeTargetsParams)
    expect(mocks.deleteRuleMock).toBeCalledWith(deleteRuleParams)
  })
})
