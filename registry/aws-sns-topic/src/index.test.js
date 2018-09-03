const AWS = require('aws-sdk')
const snsTopicComponent = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    createSNSTopicMock: jest.fn((value) => ({
      TopicArn: `arn:aws:sns:us-east-1:000000000000:${value.Name}`
    })),
    updateTopicAttributesMock: jest.fn((value) => Promise.resolve(value)),
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
  AWS.mocks.createSNSTopicMock.mockClear()
  AWS.mocks.updateTopicAttributesMock.mockClear()
  AWS.mocks.removeSNSTopicMock.mockClear()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('SNS Topic Unit Tests', () => {
  it('should deploy SNS topic component', async () => {
    const snsTopicContextMock = {
      state: {},
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

  it('should deploy SNS topic component with topic attributes', async () => {
    const snsTopicContextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'some-sns-topic-name',
      policy: {
        Version: '2008-10-17',
        Id: 'policy_id',
        Statement: [
          {
            Effect: 'Allow',
            Sid: 'statement_id',
            Principal: { AWS: '*' },
            Action: ['SNS:Publish'],
            Resource: 'arn:aws:sns:us-east-1:000000000000:my-sns-topic'
          }
        ]
      },
      deliveryPolicy: {
        http: {
          defaultHealthyRetryPolicy: {
            backoffFunction: 'arithmetic'
          }
        }
      },
      displayName: 'NewSNSTopic',
      deliveryStatusAttributes: [
        {
          ApplicationSuccessFeedbackRoleArn:
            'arn:aws:iam::000000000000:role/sns-success-feedback-role',
          ApplicationSuccessFeedbackSampleRate: 100,
          ApplicationFailureFeedbackRoleArn:
            'arn:aws:iam::000000000000:role/sns-failure-feedback-role'
        },
        {
          HTTPSuccessFeedbackRoleArn: 'arn:aws:iam::000000000000:role/sns-success-feedback-role',
          HTTPSuccessFeedbackSampleRate: 100,
          HTTPFailureFeedbackRoleArn: 'arn:aws:iam::000000000000:role/sns-failure-feedback-role'
        },
        {
          LambdaSuccessFeedbackRoleArn: 'arn:aws:iam::000000000000:role/sns-success-feedback-role',
          LambdaSuccessFeedbackSampleRate: 100,
          LambdaFailureFeedbackRoleArn: 'arn:aws:iam::000000000000:role/sns-success-feedback-role'
        },
        {
          SQSSuccessFeedbackRoleArn: 'arn:aws:iam::000000000000:role/sns-success-feedback-role',
          SQSSuccessFeedbackSampleRate: 100,
          SQSFailureFeedbackRoleArn: 'arn:aws:iam::000000000000:role/sns-success-feedback-role'
        }
      ]
    }

    const outputs = await snsTopicComponent.deploy(inputs, snsTopicContextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createSNSTopicMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'DeliveryPolicy',
        AttributeValue: '{"http":{"defaultHealthyRetryPolicy":{"backoffFunction":"arithmetic"}}}',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'Policy',
        AttributeValue:
          '{"Version":"2008-10-17","Id":"policy_id","Statement":[{"Effect":"Allow","Sid":"statement_id","Principal":{"AWS":"*"},"Action":["SNS:Publish"],"Resource":"arn:aws:sns:us-east-1:000000000000:my-sns-topic"}]}',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'DisplayName',
        AttributeValue: 'NewSNSTopic',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'ApplicationSuccessFeedbackRoleArn',
        AttributeValue: 'arn:aws:iam::000000000000:role/sns-success-feedback-role',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'ApplicationSuccessFeedbackSampleRate',
        AttributeValue: '100',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'ApplicationFailureFeedbackRoleArn',
        AttributeValue: 'arn:aws:iam::000000000000:role/sns-failure-feedback-role',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'HTTPSuccessFeedbackRoleArn',
        AttributeValue: 'arn:aws:iam::000000000000:role/sns-success-feedback-role',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'HTTPSuccessFeedbackSampleRate',
        AttributeValue: '100',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'HTTPFailureFeedbackRoleArn',
        AttributeValue: 'arn:aws:iam::000000000000:role/sns-failure-feedback-role',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'LambdaSuccessFeedbackRoleArn',
        AttributeValue: 'arn:aws:iam::000000000000:role/sns-success-feedback-role',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'LambdaSuccessFeedbackSampleRate',
        AttributeValue: '100',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'SQSSuccessFeedbackSampleRate',
        AttributeValue: '100',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'SQSFailureFeedbackRoleArn',
        AttributeValue: 'arn:aws:iam::000000000000:role/sns-success-feedback-role',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'SQSSuccessFeedbackRoleArn',
        AttributeValue: 'arn:aws:iam::000000000000:role/sns-success-feedback-role',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(outputs.arn).toEqual(`arn:aws:sns:us-east-1:000000000000:${inputs.name}`)
    expect(AWS.mocks.updateTopicAttributesMock).toHaveBeenCalledTimes(15)
    expect(snsTopicContextMock.saveState).toHaveBeenCalledTimes(2)
  })

  it('should update SNS topic component with topic attributes', async () => {
    const snsTopicContextMock = {
      state: {
        topicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name',
        name: 'some-sns-topic-name',
        displayName: 'MySNSTopic'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'some-sns-topic-name',
      policy: {
        Version: '2008-10-17',
        Id: 'policy_id',
        Statement: [
          {
            Effect: 'Allow',
            Sid: 'statement_id',
            Principal: { AWS: '*' },
            Action: ['SNS:Publish'],
            Resource: 'arn:aws:sns:us-east-1:000000000000:my-sns-topic'
          }
        ]
      },
      deliveryPolicy: {
        http: {
          defaultHealthyRetryPolicy: {
            backoffFunction: 'arithmetic'
          }
        }
      },
      displayName: 'NewSNSTopic',
      deliveryStatusAttributes: [
        {
          ApplicationSuccessFeedbackRoleArn:
            'arn:aws:iam::000000000000:role/sns-success-feedback-role',
          ApplicationSuccessFeedbackSampleRate: 100,
          ApplicationFailureFeedbackRoleArn:
            'arn:aws:iam::000000000000:role/sns-failure-feedback-role'
        },
        {
          HTTPSuccessFeedbackRoleArn: 'arn:aws:iam::000000000000:role/sns-success-feedback-role',
          HTTPSuccessFeedbackSampleRate: 100,
          HTTPFailureFeedbackRoleArn: 'arn:aws:iam::000000000000:role/sns-failure-feedback-role'
        },
        {
          LambdaSuccessFeedbackRoleArn: 'arn:aws:iam::000000000000:role/sns-success-feedback-role',
          LambdaSuccessFeedbackSampleRate: 100,
          LambdaFailureFeedbackRoleArn: 'arn:aws:iam::000000000000:role/sns-success-feedback-role'
        },
        {
          SQSSuccessFeedbackRoleArn: 'arn:aws:iam::000000000000:role/sns-success-feedback-role',
          SQSSuccessFeedbackSampleRate: 100,
          SQSFailureFeedbackRoleArn: 'arn:aws:iam::000000000000:role/sns-success-feedback-role'
        }
      ]
    }

    const outputs = await snsTopicComponent.deploy(inputs, snsTopicContextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.removeSNSTopicMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.updateTopicAttributesMock).toHaveBeenCalledTimes(15)
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'DeliveryPolicy',
        AttributeValue: '{"http":{"defaultHealthyRetryPolicy":{"backoffFunction":"arithmetic"}}}',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'Policy',
        AttributeValue:
          '{"Version":"2008-10-17","Id":"policy_id","Statement":[{"Effect":"Allow","Sid":"statement_id","Principal":{"AWS":"*"},"Action":["SNS:Publish"],"Resource":"arn:aws:sns:us-east-1:000000000000:my-sns-topic"}]}',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'DisplayName',
        AttributeValue: 'NewSNSTopic',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'ApplicationSuccessFeedbackRoleArn',
        AttributeValue: 'arn:aws:iam::000000000000:role/sns-success-feedback-role',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'ApplicationSuccessFeedbackSampleRate',
        AttributeValue: '100',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'ApplicationFailureFeedbackRoleArn',
        AttributeValue: 'arn:aws:iam::000000000000:role/sns-failure-feedback-role',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'HTTPSuccessFeedbackRoleArn',
        AttributeValue: 'arn:aws:iam::000000000000:role/sns-success-feedback-role',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'HTTPSuccessFeedbackSampleRate',
        AttributeValue: '100',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'HTTPFailureFeedbackRoleArn',
        AttributeValue: 'arn:aws:iam::000000000000:role/sns-failure-feedback-role',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'LambdaSuccessFeedbackRoleArn',
        AttributeValue: 'arn:aws:iam::000000000000:role/sns-success-feedback-role',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'LambdaSuccessFeedbackSampleRate',
        AttributeValue: '100',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'SQSSuccessFeedbackSampleRate',
        AttributeValue: '100',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'SQSFailureFeedbackRoleArn',
        AttributeValue: 'arn:aws:iam::000000000000:role/sns-success-feedback-role',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'SQSSuccessFeedbackRoleArn',
        AttributeValue: 'arn:aws:iam::000000000000:role/sns-success-feedback-role',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(outputs.arn).toEqual(`arn:aws:sns:us-east-1:000000000000:${inputs.name}`)
    expect(snsTopicContextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should remove SNS topic policy', async () => {
    const snsTopicContextMock = {
      state: {
        topicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name',
        name: 'some-sns-topic-name',
        displayName: 'MySNSTopic',
        policy: {
          Version: '2008-10-17',
          Id: 'policy_id',
          Statement: [
            {
              Effect: 'Allow',
              Sid: 'statement_id',
              Principal: { AWS: '*' },
              Action: ['SNS:Publish'],
              Resource: 'arn:aws:sns:us-east-1:000000000000:my-sns-topic'
            }
          ]
        }
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'some-sns-topic-name',
      displayName: 'NewSNSTopic'
    }

    const outputs = await snsTopicComponent.deploy(inputs, snsTopicContextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.removeSNSTopicMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.updateTopicAttributesMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'DisplayName',
        AttributeValue: 'NewSNSTopic',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(outputs.arn).toEqual(`arn:aws:sns:us-east-1:000000000000:${inputs.name}`)
    expect(snsTopicContextMock.saveState).toHaveBeenCalledTimes(3)
  })

  it('should update SNS topic component with empty topic attributes (reset to default)', async () => {
    const snsTopicContextMock = {
      state: {
        topicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name',
        name: 'some-sns-topic-name',
        displayName: 'MySNSTopic',
        deliveryStatusAttributes: [
          { ApplicationSuccessFeedbackRoleArn: 'arn:aws:iam::536219383349:role/sns-role' },
          { ApplicationSuccessFeedbackSampleRate: 100 },
          { ApplicationFailureFeedbackRoleArn: 'arn:aws:iam::536219383349:role/sns-role' }
        ]
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'some-sns-topic-name',
      policy: {
        Version: '2008-10-17',
        Id: 'policy_id',
        Statement: [
          {
            Effect: 'Allow',
            Sid: 'statement_id',
            Principal: { AWS: '*' },
            Action: ['SNS:Publish'],
            Resource: 'arn:aws:sns:us-east-1:000000000000:my-sns-topic'
          }
        ]
      },
      deliveryPolicy: {
        http: {
          defaultHealthyRetryPolicy: {
            backoffFunction: 'arithmetic'
          }
        }
      }
    }

    const outputs = await snsTopicComponent.deploy(inputs, snsTopicContextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.removeSNSTopicMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.updateTopicAttributesMock).toHaveBeenCalledTimes(6)
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'DeliveryPolicy',
        AttributeValue: '{"http":{"defaultHealthyRetryPolicy":{"backoffFunction":"arithmetic"}}}',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'Policy',
        AttributeValue:
          '{"Version":"2008-10-17","Id":"policy_id","Statement":[{"Effect":"Allow","Sid":"statement_id","Principal":{"AWS":"*"},"Action":["SNS:Publish"],"Resource":"arn:aws:sns:us-east-1:000000000000:my-sns-topic"}]}',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'DisplayName',
        AttributeValue: '',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'ApplicationFailureFeedbackRoleArn',
        AttributeValue: '',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'ApplicationSuccessFeedbackSampleRate',
        AttributeValue: '',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(AWS.mocks.updateTopicAttributesMock).toBeCalledWith(
      expect.objectContaining({
        AttributeName: 'ApplicationSuccessFeedbackRoleArn',
        AttributeValue: '',
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name'
      })
    )
    expect(outputs.arn).toEqual(`arn:aws:sns:us-east-1:000000000000:${inputs.name}`)
    expect(snsTopicContextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should not try to update attributes if nothing is changed', async () => {
    const snsTopicContextMock = {
      state: {
        topicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name',
        name: 'some-sns-topic-name',
        displayName: 'MySNSTopic',
        policy: {
          Version: '2008-10-17',
          Id: 'policy_id',
          Statement: [
            {
              Effect: 'Allow',
              Sid: 'statement_id',
              Principal: { AWS: '*' },
              Action: ['SNS:Publish'],
              Resource: 'arn:aws:sns:us-east-1:000000000000:my-sns-topic'
            }
          ]
        }
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'some-sns-topic-name',
      displayName: 'MySNSTopic',
      policy: {
        Version: '2008-10-17',
        Id: 'policy_id',
        Statement: [
          {
            Effect: 'Allow',
            Sid: 'statement_id',
            Principal: { AWS: '*' },
            Action: ['SNS:Publish'],
            Resource: 'arn:aws:sns:us-east-1:000000000000:my-sns-topic'
          }
        ]
      }
    }

    const outputs = await snsTopicComponent.deploy(inputs, snsTopicContextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.removeSNSTopicMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.updateTopicAttributesMock).toHaveBeenCalledTimes(0)
    expect(outputs.arn).toEqual(`arn:aws:sns:us-east-1:000000000000:${inputs.name}`)
    expect(snsTopicContextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should rename SNS topic component', async () => {
    const snsTopicContextMock = {
      state: {
        topicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name',
        name: 'some-sns-topic-name'
      },
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

  it('should delete SNS topic component', async () => {
    const snsTopicContextMock = {
      state: {
        topicArn: 'arn:aws:sns:us-east-1:000000000000:some-sns-topic-name',
        name: 'some-sns-topic-name'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'some-sns-topic-name'
    }

    await snsTopicComponent.remove(inputs, snsTopicContextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.removeSNSTopicMock).toHaveBeenCalledTimes(1)
    expect(snsTopicContextMock.saveState).toHaveBeenCalledTimes(1)
  })
})
