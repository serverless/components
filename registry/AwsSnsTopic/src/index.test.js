import path from 'path'
import {
  createContext,
  deserialize,
  resolveComponentEvaluables,
  serialize
} from '../../../src/utils'

let context
let ComponentType

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
  beforeEach(async () => {
    context = await createContext({ cwd: path.join(__dirname, '..') }, { app: { id: 'test' } })
    ComponentType = await context.loadType('./')
  })

  it('should create topic if first deployment', async () => {
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
    const awsSnsTopic = await context.construct(ComponentType, inputs)

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
    const awsSnsTopic = await context.construct(ComponentType, inputs)

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

    const awsSnsTopic = await context.construct(ComponentType, inputs)

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

  it('shouldDeploy should return "undefined" if nothing changed', async () => {
    const inputs = {
      topicName: 'myTopic',
      displayName: 'My Topic',
      policy: {},
      deliveryPolicy: {},
      deliveryStatusAttributes: [],
      provider
    }
    let oldComponent = await context.construct(ComponentType, inputs)
    oldComponent = await context.defineComponent(oldComponent)
    oldComponent = resolveComponentEvaluables(oldComponent)
    await oldComponent.deploy(null, context)

    const prevComponent = await deserialize(serialize(oldComponent, context), context)

    let newComponent = await context.construct(ComponentType, inputs)
    newComponent = await context.defineComponent(newComponent)
    newComponent = resolveComponentEvaluables(newComponent)

    const res = newComponent.shouldDeploy(prevComponent)
    expect(res).toBe(undefined)
  })

  it('shouldDeploy should return "replace" if "topic" changed', async () => {
    const inputs = {
      topicName: 'myTopic',
      displayName: 'My Topic',
      policy: {},
      deliveryPolicy: {},
      deliveryStatusAttributes: [],
      provider
    }
    let oldComponent = await context.construct(ComponentType, inputs)
    oldComponent = await context.defineComponent(oldComponent)
    oldComponent = resolveComponentEvaluables(oldComponent)
    await oldComponent.deploy(null, context)

    const prevComponent = await deserialize(serialize(oldComponent, context), context)

    let newComponent = await context.construct(ComponentType, {
      ...inputs,
      topicName: 'myOtherTopic'
    })
    newComponent = await context.defineComponent(newComponent)
    newComponent = resolveComponentEvaluables(newComponent)

    const res = newComponent.shouldDeploy(prevComponent)
    expect(res).toBe('replace')
  })

  it('shouldDeploy should return deploy if first deployment', async () => {
    const inputs = {
      topicName: 'myTopic',
      displayName: 'My Topic',
      policy: {},
      deliveryPolicy: {},
      deliveryStatusAttributes: [],
      provider
    }
    let oldComponent = await context.construct(ComponentType, inputs)
    oldComponent = await context.defineComponent(oldComponent)
    oldComponent = resolveComponentEvaluables(oldComponent)
    const res = oldComponent.shouldDeploy(null, context)
    expect(res).toBe('deploy')
  })
})
