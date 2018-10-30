import AWS from 'aws-sdk'
import * as protocol from './sqs'

jest.mock('aws-sdk', () => {
  const mocks = {
    subscribeMock: jest.fn((value) => ({
      SubscriptionArn: `arn:aws:sns:us-east-1:000000000000:${
        value.TopicArn
      }:00000000-0000-0000-0000-000000000000`
    })),
    unsubscribeMock: jest.fn(),
    setQueueAttributesMock: jest.fn()
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

  const SQS = function() {
    return {
      setQueueAttributes: (obj) => ({
        promise: () => mocks.setQueueAttributesMock(obj)
      })
    }
  }

  return {
    mocks,
    SNS,
    SQS
  }
})

afterEach(() => {
  AWS.mocks.subscribeMock.mockClear()
  AWS.mocks.unsubscribeMock.mockClear()
  AWS.mocks.setQueueAttributesMock.mockClear()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('SNS Subscription - SQS protocol tests', () => {
  it('should return correct types', () => {
    expect(protocol.types).toEqual(['sqs'])
  })

  it('should subscribe to SNS topic and return Subscription Arn and statement', async () => {
    // mock Date.now for statement Sid
    Date.now = jest.fn(() => 0)
    const contextMock = {
      log: () => {}
    }
    const instance = {
      topic: 'topic-arn',
      protocol: 'sqs',
      endpoint: 'sqs-arn',
      provider: {
        getSdk() {
          return AWS
        }
      }
    }
    const { subscriptionArn, permission } = await protocol.deploy(instance, contextMock)
    expect(subscriptionArn).toBe(
      `arn:aws:sns:us-east-1:000000000000:${instance.topic}:00000000-0000-0000-0000-000000000000`
    )
    expect(permission).toEqual({
      Attributes: {
        Policy:
          '{"Version":"2012-10-17","Id":"SQSQueuePolicy0","Statement":[{"Sid":"SQSStatement0","Effect":"Allow","Principal":"*","Action":["sqs:SendMessage"],"Resource":"sqs-arn","Condition":{"ArnEquals":{"aws:SourceArn":"topic-arn"}}}]}'
      },
      QueueUrl: 'https://sqs.undefined.amazonaws.com/undefined/undefined'
    })
    expect(AWS.mocks.subscribeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        Endpoint: instance.endpoint,
        Protocol: instance.protocol,
        TopicArn: instance.topic
      })
    )
    expect(AWS.mocks.subscribeMock).toHaveBeenCalledTimes(1)
    // restore Date.now mock
    Date.now.mockRestore()
  })

  it('should unsubscribe from SNS topic', async () => {
    const contextMock = {
      log: () => {}
    }
    const instance = {
      subscriptionArn:
        'arn:aws:sns:us-east-1:000000000000:topic-arn:00000000-0000-0000-0000-000000000000',
      permission: {
        Attributes: {
          Policy:
            '{"Version":"2012-10-17","Id":"SQSQueuePolicy0","Statement":[{"Sid":"SQSStatement0","Effect":"Allow","Principal":"*","Action":["sqs:SendMessage"],"Resource":"sqs-arn","Condition":{"ArnEquals":{"aws:SourceArn":"topic-arn"}}}]}'
        },
        QueueUrl: 'https://sqs.undefined.amazonaws.com/undefined/undefined'
      },
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
