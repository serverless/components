const unsubscribe = require('./unsubscribe')

const mockUnsubscribe = jest.fn()

jest.mock('@serverless/event-gateway-sdk', () =>
  jest.fn().mockImplementation(() => ({
    unsubscribe: mockUnsubscribe
  }))
)

describe('#unsubscribe()', () => {
  it('should delete a subscription from the Event Gateway', async () => {
    const inputs = {
      url: 'http://localhost',
      space: 'my-space',
      accessKey: 's0m34cc355k3y',
      subscriptionId: 'randomSubscriptionId'
    }

    const res = await unsubscribe(inputs)

    const { subscriptionId } = inputs
    expect(mockUnsubscribe).toBeCalledWith({ subscriptionId })
    expect(res).toEqual(true)
  })
})
