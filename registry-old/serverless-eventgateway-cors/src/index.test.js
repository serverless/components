const { createCors, updateCors, deleteCors } = require('./utils')
const egCorsComponent = require('./index')

jest.mock('./utils/createCors')
jest.mock('./utils/updateCors')
jest.mock('./utils/deleteCors')

createCors.mockImplementation(() =>
  Promise.resolve({
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
)
updateCors.mockImplementation(() =>
  Promise.resolve({
    space: 'my-space',
    corsId: 'randomCorsId',
    method: 'POST',
    path: '/my-path',
    allowedOrigins: ['*', 'http://example.com'],
    allowedMethods: ['POST', 'GET'],
    allowedHeaders: ['Origin', 'Accept'],
    allowCredentials: false,
    metadata: {}
  })
)
deleteCors.mockImplementation(() => Promise.resolve(true))

afterAll(() => {
  jest.restoreAllMocks()
})

describe('serverless-eventgateway-cors tests', () => {
  let inputs
  let context

  beforeEach(() => {
    jest.clearAllMocks()

    inputs = {
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
    context = {
      state: {
        ...inputs
      },
      log: jest.fn(),
      saveState: jest.fn()
    }
  })

  describe('when running "deploy"', () => {
    it('should create a new CORS configuration at the Event Gateway', async () => {
      // empty state --> CORS config is not yet created
      context.state = {}

      const outputs = await egCorsComponent.deploy(inputs, context)

      const expectedState = { ...inputs, metadata: {}, corsId: 'randomCorsId' }
      delete expectedState.accessKey

      expect(outputs).toEqual({ method: 'POST', path: '/my-path', corsId: 'randomCorsId' })
      expect(createCors).toBeCalledWith(inputs)
      expect(context.log).toHaveBeenCalled()
      expect(context.saveState).toBeCalledWith(expectedState)
    })

    it('should update an existing CORS configuration at the Event Gateway', async () => {
      // changing the allowedOrigins array
      inputs.allowedOrigins.push('http://example.com')

      const outputs = await egCorsComponent.deploy(inputs, context)

      const expectedState = { ...context.state, metadata: {}, corsId: 'randomCorsId' }
      delete expectedState.accessKey

      expect(outputs).toEqual({ method: 'POST', path: '/my-path', corsId: 'randomCorsId' })
      expect(updateCors).toBeCalledWith({ ...context.state, accessKey: inputs.accessKey })
      expect(context.log).toHaveBeenCalled()
      expect(context.saveState).toBeCalledWith(expectedState)
    })
  })

  describe('when running "remove"', () => {
    it('should remove the CORS configuration from the Event Gateway', async () => {
      const outputs = await egCorsComponent.remove(inputs, context)

      expect(outputs).toEqual({})
      expect(deleteCors).toBeCalledWith({ ...context.state, accessKey: inputs.accessKey })
      expect(context.log).toHaveBeenCalled()
      expect(context.saveState).toHaveBeenCalledTimes(1)
    })
  })
})
