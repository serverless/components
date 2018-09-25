const updateEventType = require('./updateEventType')

const mockUpdateEventType = jest.fn().mockResolvedValue({
  space: 'my-space',
  name: 'my.event',
  authorizerId: 'authFunction',
  metadata: {}
})

jest.mock('@serverless/event-gateway-sdk', () =>
  jest.fn().mockImplementation(() => ({
    updateEventType: mockUpdateEventType
  }))
)

describe('#updateEventType()', () => {
  it('should update an existing event type at the Event Gateway', async () => {
    const inputs = {
      url: 'http://localhost',
      space: 'my-space',
      accessKey: 's0m34cc355k3y',
      name: 'my.event',
      authorizerId: 'authFunction'
    }

    const res = await updateEventType(inputs)

    const { name, authorizerId } = inputs
    expect(mockUpdateEventType).toBeCalledWith({ name, authorizerId })
    expect(res).toEqual({
      space: 'my-space',
      name: 'my.event',
      authorizerId: 'authFunction',
      metadata: {}
    })
  })
})
