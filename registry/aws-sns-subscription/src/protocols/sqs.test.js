const AWS = require('aws-sdk')
const protocol = require('./sqs')

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

  const SNS = {
    subscribe: (obj) => ({
      promise: () => mocks.subscribeMock(obj)
    }),
    unsubscribe: (obj) => ({
      promise: () => mocks.unsubscribeMock(obj)
    })
  }

  const SQS = {
    setQueueAttributes: (obj) => ({
      promise: () => mocks.setQueueAttributesMock(obj)
    })
  }

  return {
    mocks,
    SNS: jest.fn().mockImplementation(() => SNS),
    SQS: jest.fn().mockImplementation(() => SQS)
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
    const inputs = { topic: 'topic-arn', protocol: 'sqs', endpoint: 'sqs-arn' }
    const { subscriptionArn, permission } = await protocol.deploy(inputs, contextMock)
    expect(subscriptionArn).toBe(
      `arn:aws:sns:us-east-1:000000000000:${inputs.topic}:00000000-0000-0000-0000-000000000000`
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
        Endpoint: inputs.endpoint,
        Protocol: inputs.protocol,
        TopicArn: inputs.topic
      })
    )
    expect(AWS.mocks.subscribeMock).toHaveBeenCalledTimes(1)
    // restore Date.now mock
    Date.now.mockRestore()
  })

  it('should unsubscribe from SNS topic', async () => {
    const contextMock = {
      state: {
        subscriptionArn:
          'arn:aws:sns:us-east-1:000000000000:topic-arn:00000000-0000-0000-0000-000000000000',
        permission: {
          Attributes: {
            Policy:
              '{"Version":"2012-10-17","Id":"SQSQueuePolicy0","Statement":[{"Sid":"SQSStatement0","Effect":"Allow","Principal":"*","Action":["sqs:SendMessage"],"Resource":"sqs-arn","Condition":{"ArnEquals":{"aws:SourceArn":"topic-arn"}}}]}'
          },
          QueueUrl: 'https://sqs.undefined.amazonaws.com/undefined/undefined'
        }
      },
      log: () => {}
    }
    await protocol.remove(contextMock)
    expect(AWS.mocks.unsubscribeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        SubscriptionArn: contextMock.state.subscriptionArn
      })
    )
    expect(AWS.mocks.unsubscribeMock).toHaveBeenCalledTimes(1)
  })
})
