import AWS from 'aws-sdk'
import * as lib from './lib'

jest.mock('aws-sdk', () => {
  const mocks = {
    subscribeMock: jest.fn((value) => ({
      SubscriptionArn: `arn:aws:sns:us-east-1:000000000000:${
        value.TopicArn
      }:00000000-0000-0000-0000-000000000000`
    })),
    unsubscribeMock: jest.fn(),
    listSubscriptionsByTopicMock: jest.fn(),
    setSubscriptionAttributesMock: jest.fn().mockImplementation((params) => {
      if (params.AttributeValue === 'error-suppress') {
        return Promise.reject(
          new Error('Delivery protocol [lambda] does not support raw message delivery.')
        )
      } else if (params.AttributeValue === 'error') {
        return Promise.reject(new Error('Error'))
      }
      return Promise.resolve()
    })
  }

  const SNS = function() {
    return {
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
  }

  return {
    mocks,
    SNS
  }
})

afterEach(() => {
  AWS.mocks.subscribeMock.mockClear()
  AWS.mocks.unsubscribeMock.mockClear()
  AWS.mocks.listSubscriptionsByTopicMock.mockClear()
  AWS.mocks.setSubscriptionAttributesMock.mockClear()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('SNS Subscription - Protocol library tests', () => {
  it('should subscribe to SNS topic and return Subscription Arn', async () => {
    const contextMock = {
      log: () => {}
    }
    const instance = {
      topic: 'topic-arn',
      protocol: 'protocol',
      endpoint: 'endpoint',
      provider: {
        getSdk() {
          return AWS
        }
      }
    }
    const { SubscriptionArn } = await lib.subscribe(instance, contextMock)
    expect(SubscriptionArn).toBe(
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
    await lib.unsubscribe(instance, contextMock)
    expect(AWS.mocks.unsubscribeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        SubscriptionArn: instance.subscriptionArn
      })
    )
    expect(AWS.mocks.unsubscribeMock).toHaveBeenCalledTimes(1)
  })

  it('should set subscription attributes', async () => {
    const contextMock = {
      log: () => {}
    }
    const instance = {
      subscriptionArn:
        'arn:aws:sns:us-east-1:000000000000:topic:00000000-0000-0000-0000-000000000000',
      attributeName: 'DeliveryPolicy',
      attributeValue: 'delivery-policy',
      provider: {
        getSdk() {
          return AWS
        }
      }
    }
    await lib.setSubscriptionAttributes(instance, contextMock)
    expect(AWS.mocks.setSubscriptionAttributesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        AttributeName: instance.attributeName,
        AttributeValue: instance.attributeValue,
        SubscriptionArn: instance.subscriptionArn
      })
    )
    expect(AWS.mocks.setSubscriptionAttributesMock).toHaveBeenCalledTimes(1)
  })

  it('should suppress error if setting raw message delivery fails if not supported', async () => {
    const contextMock = {
      log: () => {}
    }
    const instance = {
      subscriptionArn:
        'arn:aws:sns:us-east-1:000000000000:topic:00000000-0000-0000-0000-000000000000',
      attributeName: 'RawMessageDelivery',
      attributeValue: 'error-suppress',
      provider: {
        getSdk() {
          return AWS
        }
      }
    }
    await lib.setSubscriptionAttributes(instance, contextMock)
    expect(AWS.mocks.setSubscriptionAttributesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        AttributeName: instance.attributeName,
        AttributeValue: instance.attributeValue,
        SubscriptionArn: instance.subscriptionArn
      })
    )
    expect(AWS.mocks.setSubscriptionAttributesMock).toHaveBeenCalledTimes(1)
  })

  it('should throw error if setting subscription attribute fails', async () => {
    const contextMock = {
      log: () => {}
    }
    const instance = {
      subscriptionArn:
        'arn:aws:sns:us-east-1:000000000000:topic:00000000-0000-0000-0000-000000000000',
      attributeName: 'RawMessageDelivery',
      attributeValue: 'error',
      provider: {
        getSdk() {
          return AWS
        }
      }
    }
    let response
    try {
      response = await lib.setSubscriptionAttributes(instance, contextMock)
    } catch (error) {
      expect(error.message).toBe('Error')
    }

    expect(AWS.mocks.setSubscriptionAttributesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        AttributeName: instance.attributeName,
        AttributeValue: instance.attributeValue,
        SubscriptionArn: instance.subscriptionArn
      })
    )
    expect(AWS.mocks.setSubscriptionAttributesMock).toHaveBeenCalledTimes(1)
    expect(response).toBeUndefined()
  })

  it('should not wait for confirmation when SubscriptionArn is available', async () => {
    jest.setTimeout(7000)
    const instance = {
      topic: 'topic-arn',
      protocol: 'sms',
      endpoint: 'lambda-arn',
      provider: {
        getSdk() {
          return AWS
        }
      }
    }
    AWS.mocks.listSubscriptionsByTopicMock.mockReturnValue({
      Subscriptions: [
        {
          Protocol: instance.protocol,
          Endpoint: instance.endpoint,
          SubscriptionArn:
            'arn:aws:sns:us-east-1:000000000000:topic-arn:00000000-0000-0000-0000-000000000000'
        }
      ]
    })
    await lib.waitForConfirmation(instance)
    expect(AWS.mocks.listSubscriptionsByTopicMock).toHaveBeenCalledTimes(1)
  })

  it('should wait for confirmation when SubscriptionArn is "PendingConfirmation"', async () => {
    const instance = {
      topic: 'topic-arn',
      protocol: 'sms',
      endpoint: 'lambda-arn',
      provider: {
        getSdk() {
          return AWS
        }
      }
    }
    AWS.mocks.listSubscriptionsByTopicMock
      .mockReturnValueOnce({
        Subscriptions: [
          {
            Protocol: instance.protocol,
            Endpoint: instance.endpoint,
            SubscriptionArn: 'PendingConfirmation'
          }
        ]
      })
      .mockReturnValue({
        Subscriptions: [
          {
            Protocol: instance.protocol,
            Endpoint: instance.endpoint,
            SubscriptionArn:
              'arn:aws:sns:us-east-1:000000000000:topic-arn:00000000-0000-0000-0000-000000000000'
          }
        ]
      })
    await lib.waitForConfirmation(instance, 300, 1000)
    expect(AWS.mocks.listSubscriptionsByTopicMock).toHaveBeenCalledTimes(2)
  })

  it('should wait for confirmation when SubscriptionArn is "pending confirmation"', async () => {
    const instance = {
      topic: 'topic-arn',
      protocol: 'sms',
      endpoint: 'lambda-arn',
      provider: {
        getSdk() {
          return AWS
        }
      }
    }
    AWS.mocks.listSubscriptionsByTopicMock
      .mockReturnValueOnce({
        Subscriptions: [
          {
            Protocol: instance.protocol,
            Endpoint: instance.endpoint,
            SubscriptionArn: 'pending confirmation'
          }
        ]
      })
      .mockReturnValue({
        Subscriptions: [
          {
            Protocol: instance.protocol,
            Endpoint: instance.endpoint,
            SubscriptionArn:
              'arn:aws:sns:us-east-1:000000000000:topic-arn:00000000-0000-0000-0000-000000000000'
          }
        ]
      })
    await lib.waitForConfirmation(instance, 300, 1000)
    expect(AWS.mocks.listSubscriptionsByTopicMock).toHaveBeenCalledTimes(2)
  })

  it('should time out when waiting for confirmation', async () => {
    const instance = {
      topic: 'topic-arn',
      protocol: 'sms',
      endpoint: 'lambda-arn',
      provider: {
        getSdk() {
          return AWS
        }
      }
    }
    AWS.mocks.listSubscriptionsByTopicMock.mockReturnValue({
      Subscriptions: [
        {
          Protocol: instance.protocol,
          Endpoint: instance.endpoint,
          SubscriptionArn: 'pending confirmation'
        }
      ]
    })
    let output
    try {
      output = await lib.waitForConfirmation(instance, 300, 700)
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
