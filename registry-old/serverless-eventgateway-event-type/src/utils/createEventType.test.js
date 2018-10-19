const createEventType = require('./createEventType')

const mockCreateEventType = jest.fn().mockResolvedValue({
  space: 'my-space',
  name: 'my.event',
  authorizerId: 'authFunction',
  metadata: {}
})

jest.mock('@serverless/event-gateway-sdk', () =>
  jest.fn().mockImplementation(() => ({
    createEventType: mockCreateEventType
  }))
)

describe('#createEventType()', () => {
  it('should create the given event type at the Event Gateway', async () => {
    const inputs = {
      url: 'http://localhost',
      space: 'my-space',
      accessKey: 's0m34cc355k3y',
      name: 'my.event',
      authorizerId: 'authFunction'
    }

    const res = await createEventType(inputs)

    const { name, authorizerId } = inputs
    expect(mockCreateEventType).toBeCalledWith({ name, authorizerId })
    expect(res).toEqual({
      space: 'my-space',
      name: 'my.event',
      authorizerId: 'authFunction',
      metadata: {}
    })
  })
})
