const AWS = require('aws-sdk')
const protocol = require('./application')

jest.mock('aws-sdk', () => {
  const mocks = {
    subscribeMock: jest.fn((value) => ({
      SubscriptionArn: `arn:aws:sns:us-east-1:000000000000:${
        value.TopicArn
      }:00000000-0000-0000-0000-000000000000`
    })),
    unsubscribeMock: jest.fn()
  }

  const SNS = {
    subscribe: (obj) => ({
      promise: () => mocks.subscribeMock(obj)
    }),
    unsubscribe: (obj) => ({
      promise: () => mocks.unsubscribeMock(obj)
    })
  }

  return {
    mocks,
    SNS: jest.fn().mockImplementation(() => SNS)
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
    const inputs = {
      topic: 'topic-arn',
      protocol: 'application',
      endpoint: 'arn:aws:sns:us-east-1:000000000000:endpoint/ADM/application-name/uuid'
    }
    const { subscriptionArn } = await protocol.deploy(inputs, contextMock)
    expect(subscriptionArn).toBe(
      `arn:aws:sns:us-east-1:000000000000:${inputs.topic}:00000000-0000-0000-0000-000000000000`
    )
    expect(AWS.mocks.subscribeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        Endpoint: inputs.endpoint,
        Protocol: inputs.protocol,
        TopicArn: inputs.topic
      })
    )
    expect(AWS.mocks.subscribeMock).toHaveBeenCalledTimes(1)
  })

  it('should unsubscribe from SNS topic', async () => {
    const contextMock = {
      state: {
        subscriptionArn:
          'arn:aws:sns:us-east-1:000000000000:topic-arn:00000000-0000-0000-0000-000000000000'
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
