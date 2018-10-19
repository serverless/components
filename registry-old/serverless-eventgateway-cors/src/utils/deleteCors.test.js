const deleteCors = require('./deleteCors')

const mockDeleteCors = jest.fn()

jest.mock('@serverless/event-gateway-sdk', () =>
  jest.fn().mockImplementation(() => ({
    deleteCORS: mockDeleteCors
  }))
)

describe('#deleteCors()', () => {
  it('should delete the CORS configuration from the Event Gateway', async () => {
    const inputs = {
      url: 'http://localhost',
      space: 'my-space',
      accessKey: 's0m34cc355k3y',
      corsId: 'randomCorsId'
    }

    const res = await deleteCors(inputs)

    const { corsId } = inputs
    expect(mockDeleteCors).toBeCalledWith({ corsId })
    expect(res).toEqual(true)
  })
})
