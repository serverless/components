import AWS from 'aws-sdk'
import path from 'path'
import { deserialize, resolveComponentEvaluables, serialize } from '../../../src/utils'
import { createTestContext } from '../../../test'

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AwsSnsSubscription', () => {
  const cwd = path.resolve(__dirname, '..')
  let context
  let provider
  let AwsSnsSubscription
  let AwsProvider

  beforeEach(async () => {
    context = await createTestContext({ cwd })
    AwsSnsSubscription = await context.import('./')
    AwsProvider = await context.import('AwsProvider')
    provider = await context.construct(AwsProvider, {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'abc',
        secretAccessKey: 'xyz'
      }
    })
  })

  it('should create the subscription if it is the first deployment', async () => {
    const inputs = {
      topic: 'myTopic',
      displayName: 'myTopicDisplayName',
      policy: {},
      deliveryPolicy: {},
      deliveryStatusAttributes: [],
      provider
    }

    let awsSnsSubscription = await context.construct(AwsSnsSubscription, inputs)
    awsSnsSubscription = await context.defineComponent(awsSnsSubscription)
    awsSnsSubscription = resolveComponentEvaluables(awsSnsSubscription)

    await awsSnsSubscription.deploy(undefined, context)

    expect(AWS.mocks.subscribeMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.subscribeMock).toBeCalledWith({
      Endpoint: undefined,
      Protocol: 'https',
      TopicArn: 'myTopic'
    })
  })

  it('should update if subscription has changed', async () => {
    let oldAwsSnsSubscription = await context.construct(AwsSnsSubscription, {
      protocol: 'https',
      topic: 'some-old-topic',
      provider
    })
    oldAwsSnsSubscription = await context.defineComponent(oldAwsSnsSubscription)
    oldAwsSnsSubscription = resolveComponentEvaluables(oldAwsSnsSubscription)
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
    newAwsSnsSubscription = resolveComponentEvaluables(newAwsSnsSubscription)
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
    oldAwsSnsSubscription = resolveComponentEvaluables(oldAwsSnsSubscription)
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

  it('should remove the subscription even if it does not exist anymore', async () => {
    let oldAwsSnsSubscription = await context.construct(AwsSnsSubscription, {
      protocol: 'https',
      topic: 'some-topic',
      provider
    })
    oldAwsSnsSubscription = await context.defineComponent(oldAwsSnsSubscription)
    oldAwsSnsSubscription = resolveComponentEvaluables(oldAwsSnsSubscription)
    await oldAwsSnsSubscription.deploy(null, context)

    const prevAwsSnsSubscription = await deserialize(
      serialize(oldAwsSnsSubscription, context),
      context
    )
    prevAwsSnsSubscription.subscriptionArn = 'already-removed-subscription'
    await prevAwsSnsSubscription.remove(context)

    expect(AWS.mocks.unsubscribeMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.unsubscribeMock).toBeCalledWith({
      SubscriptionArn: 'already-removed-subscription'
    })
  })

  it('shouldDeploy should return undefined if nothing changed', async () => {
    let oldComponent = await context.construct(AwsSnsSubscription, {
      protocol: 'https',
      topic: 'some-topic',
      provider
    })
    oldComponent = await context.defineComponent(oldComponent)
    oldComponent = resolveComponentEvaluables(oldComponent)
    await oldComponent.deploy(null, context)

    const prevComponent = await deserialize(serialize(oldComponent, context), context)

    let newComponent = await context.construct(AwsSnsSubscription, {
      protocol: 'https',
      topic: 'some-topic',
      provider
    })
    newComponent = await context.defineComponent(newComponent)
    newComponent = resolveComponentEvaluables(newComponent)

    const res = newComponent.shouldDeploy(prevComponent)
    expect(res).toBe(undefined)
  })

  it('shouldDeploy should return "replace" if "topic" changed', async () => {
    let oldComponent = await context.construct(AwsSnsSubscription, {
      protocol: 'https',
      topic: 'some-topic',
      provider
    })
    oldComponent = await context.defineComponent(oldComponent)
    oldComponent = resolveComponentEvaluables(oldComponent)
    await oldComponent.deploy(null, context)

    const prevComponent = await deserialize(serialize(oldComponent, context), context)

    let newComponent = await context.construct(AwsSnsSubscription, {
      protocol: 'https',
      topic: 'some-another-topic',
      provider
    })
    newComponent = await context.defineComponent(newComponent)
    newComponent = resolveComponentEvaluables(newComponent)

    const res = newComponent.shouldDeploy(prevComponent)
    expect(res).toBe('replace')
  })

  it('shouldDeploy should return "replace" if "protocol" changed', async () => {
    let oldComponent = await context.construct(AwsSnsSubscription, {
      protocol: 'https',
      topic: 'some-topic',
      provider
    })
    oldComponent = await context.defineComponent(oldComponent)
    oldComponent = resolveComponentEvaluables(oldComponent)
    await oldComponent.deploy(null, context)

    const prevComponent = await deserialize(serialize(oldComponent, context), context)

    let newComponent = await context.construct(AwsSnsSubscription, {
      protocol: 'http',
      topic: 'some-topic',
      provider
    })
    newComponent = await context.defineComponent(newComponent)
    newComponent = resolveComponentEvaluables(newComponent)

    const res = newComponent.shouldDeploy(prevComponent)
    expect(res).toBe('replace')
  })

  it('shouldDeploy should return deploy if first deployment', async () => {
    let oldComponent = await context.construct(AwsSnsSubscription, {
      protocol: 'https',
      topic: 'some-topic',
      provider
    })
    oldComponent = await context.defineComponent(oldComponent)
    oldComponent = resolveComponentEvaluables(oldComponent)
    const res = oldComponent.shouldDeploy(null, context)
    expect(res).toBe('deploy')
  })

  it('should preserve props if nothing changed', async () => {
    const inputs = {
      protocol: 'https',
      topic: 'some-topic',
      provider
    }
    let oldComponent = await context.construct(AwsSnsSubscription, inputs)
    oldComponent = await context.defineComponent(oldComponent)
    oldComponent = resolveComponentEvaluables(oldComponent)
    await oldComponent.deploy(null, context)

    const prevComponent = await deserialize(serialize(oldComponent, context), context)

    let newComponent = await context.construct(AwsSnsSubscription, inputs)
    newComponent = await context.defineComponent(newComponent, prevComponent)
    newComponent = resolveComponentEvaluables(newComponent)

    expect(newComponent).toEqual(prevComponent)
  })

  it('should preserve props if nothing changed ', async () => {
    const inputs = {
      protocol: 'lambda',
      topic: 'some-topic',
      endpoint: 'test-function-name',
      provider
    }
    let oldComponent = await context.construct(AwsSnsSubscription, inputs)
    oldComponent = await context.defineComponent(oldComponent)
    oldComponent = resolveComponentEvaluables(oldComponent)
    await oldComponent.deploy(null, context)

    const prevComponent = await deserialize(serialize(oldComponent, context), context)

    let newComponent = await context.construct(AwsSnsSubscription, inputs)
    newComponent = await context.defineComponent(newComponent, prevComponent)
    newComponent = resolveComponentEvaluables(newComponent)

    expect(newComponent).toEqual(prevComponent)
  })
})
