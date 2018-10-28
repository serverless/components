import path from 'path'
import { createContext } from '../../../src/utils'

const mocks = {
  setTopicAttributesMock: jest.fn(),
  createTopicMock: jest.fn().mockReturnValue({ TopicArn: 'abc:zxc' }),
  deleteTopicMock: jest.fn()
}

const provider = {
  getSdk: () => {
    return {
      SNS: function() {
        return {
          setTopicAttributes: (obj) => ({
            promise: () => mocks.setTopicAttributesMock(obj)
          }),
          createTopic: (obj) => ({
            promise: () => mocks.createTopicMock(obj)
          }),
          deleteTopic: (obj) => ({
            promise: () => mocks.deleteTopicMock(obj)
          })
        }
      }
    }
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AwsSnsTopic', () => {
  it('should create topic if first deployment', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const inputs = {
      provider,
      topicName: 'myTopic',
      displayName: 'myTopicDisplayName',
      policy: {},
      deliveryPolicy: {},
      deliveryStatusAttributes: []
    }
    const AwsSnsTopic = await context.loadType('./')
    const awsSnsTopic = await context.construct(AwsSnsTopic, inputs)

    awsSnsTopic.provider = inputs.provider
    awsSnsTopic.topicName = inputs.topicName
    awsSnsTopic.displayName = inputs.displayName
    awsSnsTopic.policy = inputs.policy
    awsSnsTopic.deliveryPolicy = inputs.deliveryPolicy
    awsSnsTopic.deliveryStatusAttributes = inputs.deliveryStatusAttributes

    await awsSnsTopic.deploy(undefined, context)

    expect(mocks.createTopicMock).toHaveBeenCalled()
    expect(mocks.setTopicAttributesMock).toHaveBeenCalled()
  })

  it('should update topic if not first deployment', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const inputs = {
      provider,
      topicName: 'myTopic',
      displayName: 'myTopicDisplayName',
      policy: {},
      deliveryPolicy: {},
      deliveryStatusAttributes: []
    }

    const prevInstance = {
      provider,
      topicName: 'myTopic',
      displayName: 'myPrevTopicDisplayName',
      policy: {},
      deliveryPolicy: {},
      deliveryStatusAttributes: []
    }
    const AwsSnsTopic = await context.loadType('./')
    const awsSnsTopic = await context.construct(AwsSnsTopic, inputs)

    awsSnsTopic.provider = inputs.provider
    awsSnsTopic.topicName = inputs.topicName
    awsSnsTopic.displayName = inputs.displayName
    awsSnsTopic.policy = inputs.policy
    awsSnsTopic.deliveryPolicy = inputs.deliveryPolicy
    awsSnsTopic.deliveryStatusAttributes = inputs.deliveryStatusAttributes

    await awsSnsTopic.deploy(prevInstance, context)

    expect(mocks.createTopicMock).not.toHaveBeenCalled()
    expect(mocks.setTopicAttributesMock).toHaveBeenCalled()
  })

  it('should remove topic', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const inputs = {
      provider,
      topicName: 'myTopic',
      displayName: 'myTopicDisplayName',
      policy: {},
      deliveryPolicy: {},
      deliveryStatusAttributes: []
    }

    const AwsSnsTopic = await context.loadType('./')
    const awsSnsTopic = await context.construct(AwsSnsTopic, inputs)

    awsSnsTopic.provider = inputs.provider
    awsSnsTopic.topicName = inputs.topicName
    awsSnsTopic.displayName = inputs.displayName
    awsSnsTopic.policy = inputs.policy
    awsSnsTopic.deliveryPolicy = inputs.deliveryPolicy
    awsSnsTopic.deliveryStatusAttributes = inputs.deliveryStatusAttributes
    awsSnsTopic.topicArn = 'abc:zxc'

    await awsSnsTopic.remove(context)

    expect(mocks.createTopicMock).not.toHaveBeenCalled()
    expect(mocks.setTopicAttributesMock).not.toHaveBeenCalled()
    expect(mocks.deleteTopicMock).toHaveBeenCalled()
  })
})
