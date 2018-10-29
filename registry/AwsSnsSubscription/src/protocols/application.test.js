import AWS from 'aws-sdk'
import * as protocol from './application'

jest.mock('aws-sdk', () => {
  const mocks = {
    subscribeMock: jest.fn((value) => ({
      SubscriptionArn: `arn:aws:sns:us-east-1:000000000000:${
        value.TopicArn
      }:00000000-0000-0000-0000-000000000000`
    })),
    unsubscribeMock: jest.fn()
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

  return {
    mocks,
    SNS
  }
})

afterEach(() => {
  AWS.mocks.subscribeMock.mockClear()
  AWS.mocks.unsubscribeMock.mockClear()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('SNS Subscription - Application protocol tests', () => {
  it('should return correct types', () => {
    expect(protocol.types).toEqual(['application'])
  })

  it('should subscribe to SNS topic and return Subscription Arn', async () => {
    const contextMock = {
      log: () => {}
    }
    const instance = {
      topic: 'topic-arn',
      protocol: 'application',
      endpoint: 'arn:aws:sns:us-east-1:000000000000:endpoint/ADM/application-name/uuid',
      provider: {
        getSdk() {
          return AWS
        }
      }
    }
    const { subscriptionArn } = await protocol.deploy(instance, contextMock)
    expect(subscriptionArn).toBe(
      `arn:aws:sns:us-east-1:000000000000:${instance.topic}:00000000-0000-0000-0000-000000000000`
    )
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
    const contextMock = {
      log: () => {}
    }
    const instance = {
      subscriptionArn:
        'arn:aws:sns:us-east-1:000000000000:topic-arn:00000000-0000-0000-0000-000000000000',
      provider: {
        getSdk() {
          return AWS
        }
      }
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
