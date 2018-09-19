const AWS = require('aws-sdk')
const component = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    createServiceMock: jest.fn(({ serviceName }) => ({
      service: {
        serviceName: serviceName,
        status: 'ACTIVE'
      }
    })),
    updateServiceMock: jest.fn(({ service }) => ({
      service: {
        serviceName: service,
        status: 'ACTIVE'
      }
    })),
    describeServicesMock: jest.fn(({ services }) =>
      services.map((name) => ({
        serviceName: name,
        status: 'ACTIVE'
      }))
    ),
    deleteServiceMock: jest.fn().mockResolvedValue({}),
    listTasksMock: jest.fn().mockResolvedValue({
      taskArns: ['arn:aws:ecs:us-east-1:123456789012:task/92ef2e8e-62ae-411f-8f76-cedccaea4fa1']
    }),
    stopTaskMock: jest.fn().mockResolvedValue({})
  }

  const ECS = {
    createService: (obj) => ({
      promise: () => mocks.createServiceMock(obj)
    }),
    updateService: (obj) => ({
      promise: () => mocks.updateServiceMock(obj)
    }),
    describeServices: (obj) => ({
      promise: () => mocks.describeServicesMock(obj)
    }),
    deleteService: (obj) => ({
      promise: () => mocks.deleteServiceMock(obj)
    }),
    listTasks: (obj) => ({
      promise: () => mocks.listTasksMock(obj)
    }),
    stopTask: (obj) => ({
      promise: () => mocks.stopTaskMock(obj)
    })
  }
  return {
    mocks,
    ECS: jest.fn().mockImplementation(() => ECS)
  }
})

afterEach(() => {
  Object.keys(AWS.mocks).forEach((mock) => AWS.mocks[mock].mockClear())
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AWS ECS Service Unit Tests', () => {
  it('should create a new service', async () => {
    const contextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      serviceName: 'myService'
    }

    const { serviceName } = await component.deploy(inputs, contextMock)

    expect(serviceName).toBe('myService')
    expect(AWS.mocks.createServiceMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteServiceMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should update the service name', async () => {
    const contextMock = {
      state: {
        serviceName: 'myServicePrevious',
        status: 'ACTIVE'
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      serviceName: 'myService'
    }

    const { serviceName } = await component.deploy(inputs, contextMock)

    expect(serviceName).toBe('myService')
    expect(AWS.mocks.createServiceMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteServiceMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(2)
  })

  it('should remove the service', async () => {
    const contextMock = {
      state: {
        serviceName: 'myServicePrevious',
        status: 'ACTIVE'
      },
      log: () => {},
      saveState: jest.fn()
    }

    AWS.mocks.listTasksMock.mockImplementationOnce().mockResolvedValueOnce({})

    await component.remove({}, contextMock)

    expect(AWS.mocks.createServiceMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.updateServiceMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteServiceMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.listTasksMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.stopTaskMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })
})
