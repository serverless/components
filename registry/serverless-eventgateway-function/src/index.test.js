const { createFunction, updateFunction, deleteFunction } = require('./utils')
const egFunctionComponent = require('./index')

jest.mock('./utils/createFunction')
jest.mock('./utils/updateFunction')
jest.mock('./utils/deleteFunction')

createFunction.mockImplementation(() =>
  Promise.resolve({
    space: 'my-space',
    functionId: 'myFunction',
    provider: {
      arn: 'arn:aws:lambda:us-east-1:12345:function:my-function',
      region: 'us-east-1'
    },
    metadata: {}
  })
)
updateFunction.mockImplementation(() =>
  Promise.resolve({
    space: 'my-space',
    functionId: 'myFunction',
    provider: {
      arn: 'arn:aws:lambda:us-east-1:12345:function:my-function',
      region: 'eu-central-1'
    },
    metadata: {}
  })
)
deleteFunction.mockImplementation(() => Promise.resolve(true))

afterAll(() => {
  jest.restoreAllMocks()
})

describe('serverless-eventgateway-function tests', () => {
  let inputs
  let context

  beforeEach(() => {
    jest.clearAllMocks()

    inputs = {
      url: 'http://localhost',
      space: 'my-space',
      accessKey: 's0m34cc355k3y',
      functionId: 'myFunction',
      functionType: 'awslambda',
      provider: { arn: 'arn:aws:lambda:us-east-1:12345:function:my-function', region: 'us-east-1' }
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
    it('should create a new function registration at the Event Gateway', async () => {
      // empty state --> function is not yet registered
      context.state = {}

      const outputs = await egFunctionComponent.deploy(inputs, context)

      const expectedState = { ...inputs, metadata: {} }
      delete expectedState.accessKey

      expect(outputs).toEqual({ functionId: 'myFunction' })
      expect(createFunction).toBeCalledWith(inputs)
      expect(context.log).toHaveBeenCalled()
      expect(context.saveState).toBeCalledWith(expectedState)
    })

    it('should update an existing function registration at the Event Gateway', async () => {
      // changing some function provider values
      inputs.provider.region = 'eu-central-1'

      const outputs = await egFunctionComponent.deploy(inputs, context)

      const expectedState = { ...context.state, metadata: {} }
      delete expectedState.accessKey

      expect(outputs).toEqual({ functionId: 'myFunction' })
      expect(updateFunction).toBeCalledWith(inputs)
      expect(context.log).toHaveBeenCalled()
      expect(context.saveState).toBeCalledWith(expectedState)
    })
  })

  describe('when running "remove"', () => {
    it('should remove the function registration from the Event Gateway', async () => {
      const outputs = await egFunctionComponent.remove(inputs, context)

      expect(outputs).toEqual({})
      expect(deleteFunction).toBeCalledWith({ ...context.state, accessKey: inputs.accessKey })
      expect(context.log).toHaveBeenCalled()
      expect(context.saveState).toHaveBeenCalledTimes(1)
    })
  })
})
