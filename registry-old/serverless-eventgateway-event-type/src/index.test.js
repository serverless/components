const { createEventType, updateEventType, deleteEventType } = require('./utils')
const egEventTypeComponent = require('./index')

jest.mock('./utils/createEventType')
jest.mock('./utils/updateEventType')
jest.mock('./utils/deleteEventType')

createEventType.mockImplementation(() =>
  Promise.resolve({
    space: 'my-space',
    name: 'my.event',
    authorizerId: 'authFunction',
    metadata: {}
  })
)
updateEventType.mockImplementation(() =>
  Promise.resolve({
    space: 'my-space',
    name: 'my.event',
    authorizerId: 'updatedAuthFunction',
    metadata: {}
  })
)
deleteEventType.mockImplementation(() => Promise.resolve(true))

afterAll(() => {
  jest.restoreAllMocks()
})

describe('serverless-eventgateway-event-type tests', () => {
  let inputs
  let context

  beforeEach(() => {
    jest.clearAllMocks()

    inputs = {
      url: 'http://localhost',
      space: 'my-space',
      accessKey: 's0m34cc355k3y',
      name: 'my.event',
      authorizerId: 'authFunction'
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
    it('should create a new event type at the Event Gateway', async () => {
      // empty state --> event type is not yet created
      context.state = {}

      const outputs = await egEventTypeComponent.deploy(inputs, context)

      const expectedState = { ...inputs, metadata: {} }
      delete expectedState.accessKey

      expect(outputs).toEqual({ name: 'my.event' })
      expect(createEventType).toBeCalledWith(inputs)
      expect(context.log).toHaveBeenCalled()
      expect(context.saveState).toBeCalledWith(expectedState)
    })

    it('should update an existing event type at the Event Gateway', async () => {
      // changing the authorizerId
      inputs.authorizerId = 'updatedAuthFunction'

      const outputs = await egEventTypeComponent.deploy(inputs, context)

      const expectedState = { ...context.state, metadata: {}, authorizerId: inputs.authorizerId }
      delete expectedState.accessKey

      expect(outputs).toEqual({ name: 'my.event' })
      expect(updateEventType).toBeCalledWith(inputs)
      expect(context.log).toHaveBeenCalled()
      expect(context.saveState).toBeCalledWith(expectedState)
    })
  })

  describe('when running "remove"', () => {
    it('should remove the event type from the Event Gateway', async () => {
      const outputs = await egEventTypeComponent.remove(inputs, context)

      expect(outputs).toEqual({})
      expect(deleteEventType).toBeCalledWith({ ...context.state, accessKey: inputs.accessKey })
      expect(context.log).toHaveBeenCalled()
      expect(context.saveState).toHaveBeenCalledTimes(1)
    })
  })
})
