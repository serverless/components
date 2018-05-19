const AWS = require('aws-sdk') // eslint-disable-line
const cloudFrontComponent = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    getDistributionMock: jest.fn().mockImplementation((params) => {
      if (params.Id === 'doesNotExist') {
        return Promise.reject(new Error('The specified distribution does not exist'))
      } else if (params.Id === 'disabled') {
        return Promise.reject(
          new Error('The distribution you are trying to delete has not been disabled')
        )
      }
      return Promise.resolve()
    })
  }

  const CloudFront = {
    getDistribution: (obj) => ({
      promise: () => mocks.getDistributionMock(obj)
    })
  }
  return {
    mocks,
    CloudFront: jest.fn().mockImplementation(() => CloudFront)
  }
})

afterEach(() => {
  AWS.mocks.getDistributionMock.mockClear()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('CloudFront Component Unit Tests', () => {
  it('should throw a RETAIN_STATE error when aws throws a distribution not disabled error', async () => {
    const cloudFrontContextMock = {
      state: {
        name: 'abc',
        distribution: {
          id: 'disabled',
          eTag: 'abc'
        }
      },
      archive: {},
      log: () => {},
      saveState: () => {}
    }

    const inputs = {}

    await expect(cloudFrontComponent.remove(inputs, cloudFrontContextMock)).rejects.toHaveProperty(
      'code',
      'RETAIN_STATE'
    )
    expect(AWS.CloudFront).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.getDistributionMock).toHaveBeenCalledTimes(1)
  })

  it('should NOT throw an error if distribution does not exist', async () => {
    const cloudFrontContextMock = {
      state: {
        name: 'abc',
        distribution: {
          id: 'doesNotExist',
          eTag: 'abc'
        }
      },
      archive: {},
      log: () => {},
      saveState: () => {}
    }

    const inputs = {}

    await expect(cloudFrontComponent.remove(inputs, cloudFrontContextMock)).resolves.toEqual({})
    expect(AWS.CloudFront).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.getDistributionMock).toHaveBeenCalledTimes(1)
  })
})
