import AWS from 'aws-sdk'
import * as protocol from './lambda'

jest.mock('aws-sdk', () => {
  const mocks = {
    subscribeMock: jest.fn((value) => ({
      SubscriptionArn: `arn:aws:sns:us-east-1:000000000000:${
        value.TopicArn
      }:00000000-0000-0000-0000-000000000000`
    })),
    unsubscribeMock: jest.fn(),
    addPermissionMock: jest.fn(() => ({
      Statement: '{ "mock": "statement" }'
    })),
    removePermissionMock: jest.fn()
  }

  const SNS = function() {
    return {
      subscribe: (obj) => ({
        promise: () => mocks.subscribeMock(obj)
      }),
      unsubscribe: (obj) => ({
        promise: () => mocks.unsubscribeMock(obj)
      })
    }
  }

  const Lambda = function() {
    return {
      addPermission: (obj) => ({
        promise: () => mocks.addPermissionMock(obj)
      }),
      removePermission: (obj) => ({
        promise: () => mocks.removePermissionMock(obj)
      })
    }
  }

  return {
    mocks,
    SNS,
    Lambda
  }
})

afterEach(() => {
  AWS.mocks.subscribeMock.mockClear()
  AWS.mocks.unsubscribeMock.mockClear()
  AWS.mocks.addPermissionMock.mockClear()
  AWS.mocks.removePermissionMock.mockClear()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('SNS Subscription - Lambda protocol tests', () => {
  it('should return correct types', () => {
    expect(protocol.types).toEqual(['lambda'])
  })

  it('should subscribe to SNS topic and return Subscription Arn and statement', async () => {
    const contextMock = {
      log: () => {}
    }
    const instance = {
      topic: 'topic-arn',
      protocol: 'lambda',
      endpoint: 'lambda-arn',
      provider: {
        getSdk() {
          return AWS
        }
      }
    }
    const { subscriptionArn, statement } = await protocol.deploy(instance, contextMock)
    expect(subscriptionArn).toBe(
      `arn:aws:sns:us-east-1:000000000000:${instance.topic}:00000000-0000-0000-0000-000000000000`
    )
    expect(statement).toEqual('{ "mock": "statement" }')
    expect(AWS.mocks.subscribeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        Endpoint: instance.endpoint,
        Protocol: instance.protocol,
        TopicArn: instance.topic
      })
    )
    expect(AWS.mocks.subscribeMock).toHaveBeenCalledTimes(1)
  })

  it('should unsubscribe from SNS topic', async () => {
    const instance = {
      subscriptionArn:
        'arn:aws:sns:us-east-1:000000000000:topic-arn:00000000-0000-0000-0000-000000000000',
      provider: {
        getSdk() {
          return AWS
        }
      }
    }
    const contextMock = {
      log: () => {}
    }
    await protocol.remove(instance, contextMock)
    expect(AWS.mocks.unsubscribeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        SubscriptionArn: instance.subscriptionArn
      })
    )
    expect(AWS.mocks.unsubscribeMock).toHaveBeenCalledTimes(1)
  })

  it('should unsubscribe from SNS topic when Resource and Sid is defined in state', async () => {
    const instance = {
      statement: '{ "Resource": "resource", "Sid": "sid" }',
      subscriptionArn:
        'arn:aws:sns:us-east-1:000000000000:topic-arn:00000000-0000-0000-0000-000000000000',
      provider: {
        getSdk() {
          return AWS
        }
      }
    }
    const contextMock = {
      log: () => {}
    }
    await protocol.remove(instance, contextMock)
    expect(AWS.mocks.unsubscribeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        SubscriptionArn: instance.subscriptionArn
      })
    )
    expect(AWS.mocks.unsubscribeMock).toHaveBeenCalledTimes(1)
  })
})
