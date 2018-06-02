const AWS = require('aws-sdk')
const lib = require('./lib')

jest.mock('aws-sdk', () => {
  const mocks = {
    subscribeMock: jest.fn((value) => ({
      SubscriptionArn: `arn:aws:sns:us-east-1:000000000000:${
        value.TopicArn
      }:00000000-0000-0000-0000-000000000000`
    })),
    unsubscribeMock: jest.fn(),
    listSubscriptionsByTopicMock: jest.fn(),
    setSubscriptionAttributesMock: jest.fn()
  }

  const SNS = {
    subscribe: (obj) => ({
      promise: () => mocks.subscribeMock(obj)
    }),
    unsubscribe: (obj) => ({
      promise: () => mocks.unsubscribeMock(obj)
    }),
    listSubscriptionsByTopic: (obj) => ({
      promise: () => mocks.listSubscriptionsByTopicMock(obj)
    }),
    setSubscriptionAttributes: (obj) => ({
      promise: () => mocks.setSubscriptionAttributesMock(obj)
    })
  }

  return {
    mocks,
    SNS: jest.fn().mockImplementation(() => SNS)
  }
})

afterEach(() => {
  AWS.mocks.subscribeMock.mockClear(),
    AWS.mocks.unsubscribeMock.mockClear(),
    AWS.mocks.listSubscriptionsByTopicMock.mockClear(),
    AWS.mocks.setSubscriptionAttributesMock.mockClear()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('protocol library tests', () => {
  it('should subscribe to SNS topic and return Subscription Arn', async () => {
    const contextMock = {
      log: () => {}
    }
    const inputs = { topic: 'topic-arn', protocol: 'protocol', endpoint: 'endpoint' }
    const { SubscriptionArn } = await lib.subscribe(inputs, contextMock)
    expect(SubscriptionArn).toBe(
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
    await lib.unsubscribe(contextMock)
    expect(AWS.mocks.unsubscribeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        SubscriptionArn: contextMock.state.subscriptionArn
      })
    )
    expect(AWS.mocks.unsubscribeMock).toHaveBeenCalledTimes(1)
  })

  it('should set subscription attributes', async () => {
    const contextMock = {
      log: () => {}
    }
    const inputs = {
      subscriptionArn:
        'arn:aws:sns:us-east-1:000000000000:topic:00000000-0000-0000-0000-000000000000',
      attributeName: 'DeliveryPolicy',
      attributeValue: 'delivery-policy'
    }
    await lib.setSubscriptionAttributes(inputs, contextMock)
    expect(AWS.mocks.setSubscriptionAttributesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        AttributeName: inputs.attributeName,
        AttributeValue: inputs.attributeValue,
        SubscriptionArn: inputs.subscriptionArn
      })
    )
    expect(AWS.mocks.setSubscriptionAttributesMock).toHaveBeenCalledTimes(1)
  })

  it('should unset subscription attributes', async () => {
    const contextMock = {
      log: () => {}
    }
    const inputs = {
      subscriptionArn:
        'arn:aws:sns:us-east-1:000000000000:topic:00000000-0000-0000-0000-000000000000'
    }
    await lib.deleteSubscriptionAttributes(inputs, contextMock)
    expect(AWS.mocks.setSubscriptionAttributesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        AttributeName: undefined,
        AttributeValue: '',
        SubscriptionArn: inputs.subscriptionArn
      })
    )
    expect(AWS.mocks.setSubscriptionAttributesMock).toHaveBeenCalledTimes(1)
  })

  it('should not wait for confirmation when SubscriptionArn is available', async () => {
    jest.setTimeout(7000)
    const inputs = { topic: 'topic-arn', protocol: 'sms', endpoint: 'lambda-arn' }
    AWS.mocks.listSubscriptionsByTopicMock.mockReturnValue({
      Subscriptions: [
        {
          Protocol: inputs.protocol,
          Endpoint: inputs.endpoint,
          SubscriptionArn:
            'arn:aws:sns:us-east-1:000000000000:topic-arn:00000000-0000-0000-0000-000000000000'
        }
      ]
    })
    await lib.waitForConfirmation(inputs)
    expect(AWS.mocks.listSubscriptionsByTopicMock).toHaveBeenCalledTimes(1)
  })

  it('should wait for confirmation when SubscriptionArn is "PendingConfirmation"', async () => {
    const inputs = { topic: 'topic-arn', protocol: 'sms', endpoint: 'lambda-arn' }
    AWS.mocks.listSubscriptionsByTopicMock
      .mockReturnValueOnce({
        Subscriptions: [
          {
            Protocol: inputs.protocol,
            Endpoint: inputs.endpoint,
            SubscriptionArn: 'PendingConfirmation'
          }
        ]
      })
      .mockReturnValue({
        Subscriptions: [
          {
            Protocol: inputs.protocol,
            Endpoint: inputs.endpoint,
            SubscriptionArn:
              'arn:aws:sns:us-east-1:000000000000:topic-arn:00000000-0000-0000-0000-000000000000'
          }
        ]
      })
    await lib.waitForConfirmation(inputs, 300, 1000)
    expect(AWS.mocks.listSubscriptionsByTopicMock).toHaveBeenCalledTimes(2)
  })

  it('should wait for confirmation when SubscriptionArn is "pending confirmation"', async () => {
    const inputs = { topic: 'topic-arn', protocol: 'sms', endpoint: 'lambda-arn' }
    AWS.mocks.listSubscriptionsByTopicMock
      .mockReturnValueOnce({
        Subscriptions: [
          {
            Protocol: inputs.protocol,
            Endpoint: inputs.endpoint,
            SubscriptionArn: 'pending confirmation'
          }
        ]
      })
      .mockReturnValue({
        Subscriptions: [
          {
            Protocol: inputs.protocol,
            Endpoint: inputs.endpoint,
            SubscriptionArn:
              'arn:aws:sns:us-east-1:000000000000:topic-arn:00000000-0000-0000-0000-000000000000'
          }
        ]
      })
    await lib.waitForConfirmation(inputs, 300, 1000)
    expect(AWS.mocks.listSubscriptionsByTopicMock).toHaveBeenCalledTimes(2)
  })

  it('should time out when waiting for confirmation', async () => {
    const inputs = { topic: 'topic-arn', protocol: 'sms', endpoint: 'lambda-arn' }
    AWS.mocks.listSubscriptionsByTopicMock.mockReturnValue({
      Subscriptions: [
        {
          Protocol: inputs.protocol,
          Endpoint: inputs.endpoint,
          SubscriptionArn: 'pending confirmation'
        }
      ]
    })
    let output
    try {
      output = await lib.waitForConfirmation(inputs, 300, 700)
    } catch (exception) {
      expect(exception).toBe('Confirmation timed out')
    }
    expect(output).toBeUndefined()
    expect(AWS.mocks.listSubscriptionsByTopicMock).toHaveBeenCalledTimes(2)
  })

  it('should split arns', () => {
    expect(lib.splitArn('arn:partition:service:region:account-id:resource')).toEqual({
      accountId: 'account-id',
      arn: 'arn',
      partition: 'partition',
      region: 'region',
      resource: 'resource',
      resourceType: undefined,
      service: 'service'
    })
    expect(lib.splitArn('arn:partition:service:region:account-id:resourcetype/resource')).toEqual({
      accountId: 'account-id',
      arn: 'arn',
      partition: 'partition',
      region: 'region',
      resource: 'resource',
      resourceType: 'resourcetype',
      service: 'service'
    })
    expect(lib.splitArn('arn:partition:service:region:account-id:resourcetype:resource')).toEqual({
      accountId: 'account-id',
      arn: 'arn',
      partition: 'partition',
      region: 'region',
      resource: 'resource',
      resourceType: 'resourcetype',
      service: 'service'
    })
  })
})
