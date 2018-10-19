const updateCors = require('./updateCors')

const mockUpdateCors = jest.fn().mockResolvedValue({
  space: 'my-space',
  corsId: 'randomCorsId',
  method: 'POST',
  path: '/my-path',
  allowedOrigins: ['*'],
  allowedMethods: ['POST', 'GET'],
  allowedHeaders: ['Origin', 'Accept'],
  allowCredentials: false,
  metadata: {}
})

jest.mock('@serverless/event-gateway-sdk', () =>
  jest.fn().mockImplementation(() => ({
    updateCORS: mockUpdateCors
  }))
)

describe('#updateCors()', () => {
  it('should update an existing CORS configuration at the Event Gateway', async () => {
    const inputs = {
      url: 'http://localhost',
      space: 'my-space',
      accessKey: 's0m34cc355k3y',
      corsId: 'randomCorsId',
      method: 'POST',
      path: '/my-path',
      allowedOrigins: ['*'],
      allowedMethods: ['POST', 'GET'],
      allowedHeaders: ['Origin', 'Accept'],
      allowCredentials: false
    }

    const res = await updateCors(inputs)

    const {
      corsId,
      method,
      path,
      allowedOrigins,
      allowedMethods,
      allowedHeaders,
      allowCredentials
    } = inputs
    expect(mockUpdateCors).toBeCalledWith({
      corsId,
      method,
      path,
      allowedOrigins,
      allowedMethods,
      allowedHeaders,
      allowCredentials
    })
    expect(res).toEqual({
      space: 'my-space',
      corsId: 'randomCorsId',
      method: 'POST',
      path: '/my-path',
      allowedOrigins: ['*'],
      allowedMethods: ['POST', 'GET'],
      allowedHeaders: ['Origin', 'Accept'],
      allowCredentials: false,
      metadata: {}
    })
  })
})
