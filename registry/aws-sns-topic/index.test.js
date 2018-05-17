const AWS = require('aws-sdk')
const snsTopicComponent = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    createSNSTopicMock: jest.fn((value) => ({
      TopicArn: `arn:aws:sns:us-east-1:000000000000:${value.Name}`
    })),
    updateTopicAttributesMock: jest.fn((value) => ({
      TopicArn: `arn:aws:sns:us-east-1:000000000000:${value.Name}`
    })),
    removeSNSTopicMock: jest.fn()
  }

  const SNS = {
    createTopic: (obj) => ({
      promise: () => mocks.createSNSTopicMock(obj)
    }),
    setTopicAttributes: (obj) => ({
      promise: () => mocks.updateTopicAttributesMock(obj)
    }),
    deleteTopic: (obj) => ({
      promise: () => mocks.removeSNSTopicMock(obj)
    })
  }
  return {
    mocks,
    SNS: jest.fn().mockImplementation(() => SNS)
  }
})

afterEach(() => {
  AWS.mocks.createSNSTopicMock.mockClear(),
    AWS.mocks.updateTopicAttributesMock.mockClear(),
    AWS.mocks.removeSNSTopicMock.mockClear()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('aws-sns-topic tests', () => {
  it('should deploy sns topic component with no errors', async () => {
    const snsTopicContextMock = {
      state: {},
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'some-sns-topic-name'
    }

    const outputs = await snsTopicComponent.deploy(inputs, snsTopicContextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createSNSTopicMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toEqual(`arn:aws:sns:us-east-1:000000000000:${inputs.name}`)
    expect(snsTopicContextMock.saveState).toHaveBeenCalledTimes(2)
  })

  it('should update sns topic component with no errors', async () => {
    const snsTopicContextMock = {
      state: {
        topicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name',
        name: 'some-sns-topic-name',
        deliveryPolicy: {
          http: {
            defaultHealthyRetryPolicy: {
              minDelayTarget: 18,
              maxDelayTarget: 19,
              numRetries: 8,
              numMaxDelayRetries: 2,
              numNoDelayRetries: 2,
              numMinDelayRetries: 2,
              backoffFunction: 'arithmetic'
            },
            disableSubscriptionOverrides: true,
            defaultThrottlePolicy: {
              maxReceivesPerSecond: 3
            }
          }
        },
        displayName: 'MySNSTopic'
      },
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'some-sns-topic-name',
      deliveryPolicy: {
        http: {
          defaultHealthyRetryPolicy: {
            minDelayTarget: 18,
            maxDelayTarget: 19,
            numRetries: 8,
            numMaxDelayRetries: 2,
            numNoDelayRetries: 2,
            numMinDelayRetries: 2,
            backoffFunction: 'arithmetic'
          },
          disableSubscriptionOverrides: true,
          defaultThrottlePolicy: {
            maxReceivesPerSecond: 3
          }
        }
      },
      displayName: 'MySNSTopic'
    }

    const outputs = await snsTopicComponent.deploy(inputs, snsTopicContextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.removeSNSTopicMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.updateTopicAttributesMock).toHaveBeenCalledTimes(2)
    expect(outputs.arn).toEqual(`arn:aws:sns:us-east-1:000000000000:${inputs.name}`)
    expect(snsTopicContextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should rename sns topic component with no errors', async () => {
    const snsTopicContextMock = {
      state: {
        topicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name',
        name: 'some-sns-topic-name'
      },
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'new-sns-topic-name'
    }

    const outputs = await snsTopicComponent.deploy(inputs, snsTopicContextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.removeSNSTopicMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createSNSTopicMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.updateTopicAttributesMock).toHaveBeenCalledTimes(0)
    expect(outputs.arn).toEqual(`arn:aws:sns:us-east-1:000000000000:${inputs.name}`)
    expect(snsTopicContextMock.saveState).toHaveBeenCalledTimes(3)
  })

  it('should delete sns topic component with no errors', async () => {
    const snsTopicContextMock = {
      state: {
        topicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name',
        name: 'some-sns-topic-name'
      },
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'some-sns-topic-name'
    }

    const outputs = await snsTopicComponent.remove(inputs, snsTopicContextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.removeSNSTopicMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toEqual(null)
    expect(snsTopicContextMock.saveState).toHaveBeenCalledTimes(1)
  })
})
