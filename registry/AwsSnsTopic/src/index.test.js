import AWS from 'aws-sdk'
import path from 'path'
import { deserialize, resolveComponentEvaluables, serialize } from '../../../src/utils'
import { createTestContext } from '../../../test'

beforeEach(async () => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AwsSnsTopic', () => {
  const cwd = path.resolve(__dirname, '..')
  let context
  let provider
  let AwsProvider
  let AwsSnsTopic

  beforeEach(async () => {
    context = await createTestContext({ cwd })
    context = await context.loadProject()
    context = await context.loadApp()
    AwsProvider = await context.loadType('AwsProvider')
    AwsSnsTopic = await context.loadType('./')
    provider = await context.construct(AwsProvider, {})
  })

  it('should create topic if first deployment', async () => {
    let awsSnsTopic = await context.construct(AwsSnsTopic, {
      provider,
      topicName: 'myTopic',
      displayName: 'myTopicDisplayName',
      policy: {},
      deliveryPolicy: {},
      deliveryStatusAttributes: []
    })
    awsSnsTopic = await context.defineComponent(awsSnsTopic)
    awsSnsTopic = resolveComponentEvaluables(awsSnsTopic)
    await awsSnsTopic.deploy(null, context)

    expect(AWS.mocks.createTopicMock).toHaveBeenCalled()
    expect(AWS.mocks.setTopicAttributesMock).toHaveBeenCalled()
  })

  it('should update topic if displayName has changed', async () => {
    let awsSnsTopic = await context.construct(AwsSnsTopic, {
      provider,
      topicName: 'myTopic',
      displayName: 'myTopicDisplayName',
      policy: {},
      deliveryPolicy: {},
      deliveryStatusAttributes: []
    })

    awsSnsTopic = await context.defineComponent(awsSnsTopic)
    awsSnsTopic = resolveComponentEvaluables(awsSnsTopic)
    await awsSnsTopic.deploy(null, context)

    const prevAwsSnsTopic = await deserialize(serialize(awsSnsTopic, context), context)
    jest.clearAllMocks()

    // NOTE BRN: To simulate what core does, we create an entirely new instance here but hydrate it with the previous instance

    let nextAwsSnsTopic = await context.construct(AwsSnsTopic, {
      provider: await context.construct(AwsProvider, {}),
      topicName: 'myTopic',
      displayName: 'myNewTopicDisplayName',
      policy: {},
      deliveryPolicy: {},
      deliveryStatusAttributes: []
    })
    nextAwsSnsTopic = await context.defineComponent(nextAwsSnsTopic, prevAwsSnsTopic)
    nextAwsSnsTopic = resolveComponentEvaluables(nextAwsSnsTopic)

    await nextAwsSnsTopic.deploy(prevAwsSnsTopic, context)

    expect(AWS.mocks.createTopicMock).not.toHaveBeenCalled()
    expect(AWS.mocks.setTopicAttributesMock).toHaveBeenCalled()
  })

  it('should remove topic', async () => {
    let awsSnsTopic = await context.construct(AwsSnsTopic, {
      provider,
      topicName: 'myTopic',
      displayName: 'myTopicDisplayName',
      policy: {},
      deliveryPolicy: {},
      deliveryStatusAttributes: []
    })

    awsSnsTopic = await context.defineComponent(awsSnsTopic)
    awsSnsTopic = resolveComponentEvaluables(awsSnsTopic)
    await awsSnsTopic.deploy(null, context)

    jest.clearAllMocks()

    const prevAwsSnsTopic = await deserialize(serialize(awsSnsTopic, context), context)
    await prevAwsSnsTopic.remove(context)

    expect(AWS.mocks.createTopicMock).not.toHaveBeenCalled()
    expect(AWS.mocks.setTopicAttributesMock).not.toHaveBeenCalled()
    expect(AWS.mocks.deleteTopicMock).toHaveBeenCalled()
  })
})
