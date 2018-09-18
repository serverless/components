const createCors = require('./createCors')

const mockCreateCors = jest.fn().mockResolvedValue({
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
    createCORS: mockCreateCors
  }))
)

describe('#createCors()', () => {
  it('should create the given CORS configuration at the Event Gateway', async () => {
    const inputs = {
      url: 'http://localhost',
      space: 'my-space',
      accessKey: 's0m34cc355k3y',
      method: 'POST',
      path: '/my-path',
      allowedOrigins: ['*'],
      allowedMethods: ['POST', 'GET'],
      allowedHeaders: ['Origin', 'Accept'],
      allowCredentials: false
    }

    const res = await createCors(inputs)

    const {
      method,
      path,
      allowedOrigins,
      allowedMethods,
      allowedHeaders,
      allowCredentials
    } = inputs
    expect(mockCreateCors).toBeCalledWith({
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
