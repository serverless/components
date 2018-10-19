const subscribe = require('./subscribe')

const mockSubscribe = jest.fn().mockResolvedValue({
  space: 'my-space',
  subscriptionId: 'randomSubscriptionId',
  type: 'sync',
  eventType: 'my.event',
  functionId: 'myFunction',
  method: 'POST',
  path: '/my-path',
  metadata: {}
})

jest.mock('@serverless/event-gateway-sdk', () =>
  jest.fn().mockImplementation(() => ({
    subscribe: mockSubscribe
  }))
)

describe('#subscribe()', () => {
  it('should create the given subscription at the Event Gateway', async () => {
    const inputs = {
      url: 'http://localhost',
      space: 'my-space',
      accessKey: 's0m34cc355k3y',
      subscriptionType: 'sync',
      eventType: 'my.event',
      functionId: 'myFunction',
      path: '/my-path',
      method: 'POST'
    }

    const res = await subscribe(inputs)

    const { subscriptionType, eventType, functionId, path, method } = inputs
    expect(mockSubscribe).toBeCalledWith({
      type: subscriptionType,
      eventType,
      functionId,
      path,
      method
    })
    expect(res).toEqual({
      space: 'my-space',
      subscriptionId: 'randomSubscriptionId',
      type: 'sync',
      eventType: 'my.event',
      functionId: 'myFunction',
      method: 'POST',
      path: '/my-path',
      metadata: {}
    })
  })
})
