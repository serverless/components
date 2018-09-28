const { subscribe, unsubscribe } = require('./utils')
const egSubscriptionComponent = require('./index')

jest.mock('./utils/subscribe')
jest.mock('./utils/unsubscribe')

subscribe.mockImplementation(() =>
  Promise.resolve({
    space: 'my-space',
    subscriptionId: 'randomSubscriptionId',
    type: 'sync',
    eventType: 'my.event',
    functionId: 'myFunction',
    method: 'POST',
    path: '/my-path',
    metadata: {}
  })
)
unsubscribe.mockImplementation(() => Promise.resolve(true))

afterAll(() => {
  jest.restoreAllMocks()
})

describe('serverless-eventgateway-subscription tests', () => {
  let inputs
  let context

  beforeEach(() => {
    jest.clearAllMocks()

    inputs = {
      url: 'http://localhost',
      space: 'my-space',
      accessKey: 's0m34cc355k3y',
      subscriptionType: 'sync',
      eventType: 'my.event',
      functionId: 'myFunction',
      path: '/my-path',
      method: 'POST'
    }
    context = {
      state: {
        ...inputs
      },
      log: jest.fn(),
      saveState: jest.fn()
    }
  })

  describe('when running "deploy"', () => {
    it('should create a subscription at the Event Gateway', async () => {
      // empty state --> subscription is not yet created
      context.state = {}

      const outputs = await egSubscriptionComponent.deploy(inputs, context)

      const expectedState = {
        ...inputs,
        type: 'sync',
        subscriptionId: 'randomSubscriptionId',
        metadata: {}
      }
      delete expectedState.subscriptionType
      delete expectedState.accessKey

      expect(outputs).toEqual({ subscriptionId: 'randomSubscriptionId' })
      expect(unsubscribe).not.toHaveBeenCalled()
      expect(subscribe).toBeCalledWith(inputs)
      expect(context.log).toHaveBeenCalled()
      expect(context.saveState).toBeCalledWith(expectedState)
    })

    it('should unsubscribe and re-subscribe when updating an existing subscription at the Event Gateway', async () => {
      // inputs and context are there --> subscription needs to be updated
      const outputs = await egSubscriptionComponent.deploy(inputs, context)

      const expectedState = {
        ...context.state,
        type: 'sync',
        subscriptionId: 'randomSubscriptionId',
        metadata: {}
      }
      delete expectedState.subscriptionType
      delete expectedState.accessKey

      expect(outputs).toEqual({ subscriptionId: 'randomSubscriptionId' })
      expect(unsubscribe).toBeCalledWith({ ...context.state, accessKey: inputs.accessKey })
      expect(subscribe).toBeCalledWith(inputs)
      expect(context.log).toHaveBeenCalled()
      expect(context.saveState).toBeCalledWith(expectedState)
    })
  })

  describe('when running "remove"', () => {
    it('should remove the subscription from the Event Gateway', async () => {
      const outputs = await egSubscriptionComponent.remove(inputs, context)

      expect(outputs).toEqual({})
      expect(unsubscribe).toBeCalledWith({ ...context.state, accessKey: inputs.accessKey })
      expect(context.log).toHaveBeenCalled()
      expect(context.saveState).toHaveBeenCalledTimes(1)
    })
  })
})
