const AWS = require('aws-sdk') // eslint-disable-line
const apigComponent = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    deleteRestApiMock: jest.fn().mockImplementation((params) => {
      if (params.restApiId === 'doesNotExist') {
        return Promise.reject(new Error('Invalid REST API identifier specified'))
      } else if (params.restApiId === 'throwError') {
        return Promise.reject(new Error('some random aws error'))
      }
      return Promise.resolve()
    })
  }

  const APIGateway = {
    deleteRestApi: (obj) => ({
      promise: () => mocks.deleteRestApiMock(obj)
    })
  }
  return {
    mocks,
    APIGateway: jest.fn().mockImplementation(() => APIGateway)
  }
})

afterEach(() => {
  AWS.mocks.deleteRestApiMock.mockClear()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('ApiGateway Component Unit Tests', () => {
  it('should delete rest api', async () => {
    const apigContextMock = {
      state: {
        name: 'abc',
        id: 'exists'
      },
      outputs: {},
      archive: {},
      log: () => {},
      saveState: () => {},
      setOutputs: jest.fn()
    }

    const expectedOutputs = {
      id: null,
      url: null,
      urls: null
    }

    await apigComponent.remove({}, apigContextMock)

    expect(apigContextMock.setOutputs).toBeCalledWith(expectedOutputs)
    expect(AWS.APIGateway).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteRestApiMock).toHaveBeenCalledTimes(1)
  })
  it('should NOT throw an error if rest api does not exist', async () => {
    const apigContextMock = {
      state: {
        name: 'abc',
        id: 'doesNotExist'
      },
      outputs: {},
      archive: {},
      log: () => {},
      saveState: () => {},
      setOutputs: jest.fn()
    }

    const expectedOutputs = {
      id: null,
      url: null,
      urls: null
    }
    await apigComponent.remove({}, apigContextMock)

    expect(apigContextMock.setOutputs).toBeCalledWith(expectedOutputs)
    expect(AWS.APIGateway).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteRestApiMock).toHaveBeenCalledTimes(1)
  })

  it('should throw an error if aws threw an error', async () => {
    const apigContextMock = {
      state: {
        name: 'abc',
        id: 'throwError'
      },
      outputs: {},
      archive: {},
      log: () => {},
      saveState: () => {},
      setOutputs: () => {}
    }

    await expect(apigComponent.remove({}, apigContextMock)).rejects.toHaveProperty(
      'message',
      'some random aws error'
    )
    expect(AWS.APIGateway).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteRestApiMock).toHaveBeenCalledTimes(1)
  })
})
