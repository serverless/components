const deleteEventType = require('./deleteEventType')

const mockDeleteEventType = jest.fn()

jest.mock('@serverless/event-gateway-sdk', () =>
  jest.fn().mockImplementation(() => ({
    deleteEventType: mockDeleteEventType
  }))
)

describe('#deleteFunction()', () => {
  it('should delete the event type from the Event Gateway', async () => {
    const inputs = {
      url: 'http://localhost',
      space: 'my-space',
      accessKey: 's0m34cc355k3y',
      name: 'my.event'
    }

    const res = await deleteEventType(inputs)

    const { name } = inputs
    expect(mockDeleteEventType).toBeCalledWith({ name })
    expect(res).toEqual(true)
  })
})
