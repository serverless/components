import AWS from 'aws-sdk'
import path from 'path'
import {
  createContext,
  deserialize,
  resolveComponentVariables,
  serialize
} from '../../../src/utils'

let context
let provider
let AwsSnsSubscription

const createTestContext = async () =>
  createContext(
    {
      cwd: path.join(__dirname, '..'),
      overrides: {
        debug: () => {},
        log: () => {}
      }
    },
    {
      app: {
        id: 'test'
      }
    }
  )

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AwsSnsSubscription', () => {
  beforeEach(async () => {
    context = await createTestContext()
    AwsSnsSubscription = await context.loadType('./')

    const AwsProvider = await context.loadType('AwsProvider')
    provider = await context.construct(AwsProvider, {})
  })

  it('should create the subscription if it is the first deployment', async () => {
    const inputs = {
      topicName: 'myTopic',
      displayName: 'myTopicDisplayName',
      policy: {},
      deliveryPolicy: {},
      deliveryStatusAttributes: [],
      provider
    }

    let awsSnsSubscription = await context.construct(AwsSnsSubscription, inputs)
    awsSnsSubscription = await context.defineComponent(awsSnsSubscription)
    awsSnsSubscription = resolveComponentVariables(awsSnsSubscription)

    await awsSnsSubscription.deploy(undefined, context)

    expect(AWS.mocks.subscribeMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.subscribeMock).toBeCalledWith({
      Endpoint: undefined,
      Protocol: 'https',
      TopicArn: undefined
    })
  })

  it('should update if subscription has changed', async () => {
    let oldAwsSnsSubscription = await context.construct(AwsSnsSubscription, {
      protocol: 'https',
      topic: 'some-old-topic',
      provider
    })
    oldAwsSnsSubscription = await context.defineComponent(oldAwsSnsSubscription)
    oldAwsSnsSubscription = resolveComponentVariables(oldAwsSnsSubscription)
    await oldAwsSnsSubscription.deploy(null, context)

    const prevAwsSnsSubscription = await deserialize(
      serialize(oldAwsSnsSubscription, context),
      context
    )

    let newAwsSnsSubscription = await context.construct(AwsSnsSubscription, {
      protocol: 'email',
      topic: 'some-new-topic',
      provider
    })
    newAwsSnsSubscription = await context.defineComponent(newAwsSnsSubscription)
    newAwsSnsSubscription = resolveComponentVariables(newAwsSnsSubscription)
    await newAwsSnsSubscription.deploy(prevAwsSnsSubscription, context)

    expect(AWS.mocks.subscribeMock).toBeCalledWith({
      Endpoint: undefined,
      Protocol: 'email',
      TopicArn: 'some-new-topic'
    })
  })

  it('should remove the subscription', async () => {
    let oldAwsSnsSubscription = await context.construct(AwsSnsSubscription, {
      protocol: 'https',
      topic: 'some-topic',
      provider
    })
    oldAwsSnsSubscription = await context.defineComponent(oldAwsSnsSubscription)
    oldAwsSnsSubscription = resolveComponentVariables(oldAwsSnsSubscription)
    await oldAwsSnsSubscription.deploy(null, context)

    const prevAwsSnsSubscription = await deserialize(
      serialize(oldAwsSnsSubscription, context),
      context
    )
    await prevAwsSnsSubscription.remove(context)

    expect(AWS.mocks.unsubscribeMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.unsubscribeMock).toBeCalledWith({
      SubscriptionArn: 'arn:aws:sns:region:XXXXX:test-subscription:r4nd0m'
    })
  })
})
