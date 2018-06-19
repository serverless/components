/* eslint-disable no-console */

const AWS = require('aws-sdk')

const component = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    createPlatformEndpointMock: jest.fn((value) => ({
      EndpointArn: `${value.PlatformApplicationArn}/00000000-0000-0000-0000-000000000000`
    })),
    deleteEndpointMock: jest.fn()
  }

  const SNS = {
    createPlatformEndpoint: (obj) => ({
      promise: () => mocks.createPlatformEndpointMock(obj)
    }),
    deleteEndpoint: (obj) => ({
      promise: () => mocks.deleteEndpointMock(obj)
    })
  }

  return {
    mocks,
    SNS: jest.fn().mockImplementation(() => SNS)
  }
})

afterEach(() => {
  AWS.mocks.createPlatformEndpointMock.mockClear()
  AWS.mocks.deleteEndpointMock.mockClear()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('aws-sns-platform-endpoint tests', () => {
  it('should deploy sns platform endpoint component', async () => {
    const contextMock = {
      state: {},
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      setOutputs: jest.fn()
    }

    const inputs = {
      token: 'device-token',
      platformApplication: 'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name',
      attributes: { PlatformCredential: 'token' },
      customUserData: 'custom-data'
    }

    const outputs = await component.deploy(inputs, contextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createPlatformEndpointMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteEndpointMock).toHaveBeenCalledTimes(0)
    expect(outputs.arn).toEqual(
      `${inputs.platformApplication}/00000000-0000-0000-0000-000000000000`
    )
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should update sns platform endpoint component with different token', async () => {
    const contextMock = {
      state: {
        endpointArn:
          'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name/00000000-0000-0000-0000-000000000000',
        token: 'device-token',
        platformApplication: 'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name',
        attributes: { PlatformCredential: 'token' },
        customUserData: 'custom-data'
      },
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      setOutputs: jest.fn()
    }

    const inputs = {
      token: 'other-device-token',
      platformApplication: 'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name',
      attributes: { PlatformCredential: 'token' },
      customUserData: 'custom-data'
    }

    const outputs = await component.deploy(inputs, contextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createPlatformEndpointMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteEndpointMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toEqual(
      `${inputs.platformApplication}/00000000-0000-0000-0000-000000000000`
    )
    expect(contextMock.saveState).toHaveBeenCalledTimes(2)
  })

  it('should update sns platform endpoint component with different platform application', async () => {
    const contextMock = {
      state: {
        endpointArn:
          'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name/00000000-0000-0000-0000-000000000000',
        token: 'device-token',
        platformApplication: 'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name',
        attributes: { PlatformCredential: 'token' },
        customUserData: 'custom-data'
      },
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      setOutputs: jest.fn()
    }

    const inputs = {
      token: 'device-token',
      platformApplication: 'arn:aws:sns:us-east-1:000000000000:app/PLT/other-application-name',
      attributes: { PlatformCredential: 'token' },
      customUserData: 'custom-data'
    }

    const outputs = await component.deploy(inputs, contextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createPlatformEndpointMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteEndpointMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toEqual(
      `${inputs.platformApplication}/00000000-0000-0000-0000-000000000000`
    )
    expect(contextMock.saveState).toHaveBeenCalledTimes(2)
  })

  it('should update sns platform endpoint component with different attributes', async () => {
    const contextMock = {
      state: {
        endpointArn:
          'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name/00000000-0000-0000-0000-000000000000',
        token: 'device-token',
        platformApplication: 'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name',
        attributes: { PlatformCredential: 'token' },
        customUserData: 'custom-data'
      },
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      setOutputs: jest.fn()
    }

    const inputs = {
      token: 'device-token',
      platformApplication: 'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name',
      attributes: { PlatformCredential: 'other-token' },
      customUserData: 'custom-data'
    }

    const outputs = await component.deploy(inputs, contextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createPlatformEndpointMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteEndpointMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toEqual(
      `${inputs.platformApplication}/00000000-0000-0000-0000-000000000000`
    )
    expect(contextMock.saveState).toHaveBeenCalledTimes(2)
  })

  it('should update sns platform endpoint component with different custom user data', async () => {
    const contextMock = {
      state: {
        endpointArn:
          'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name/00000000-0000-0000-0000-000000000000',
        token: 'device-token',
        platformApplication: 'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name',
        attributes: { PlatformCredential: 'token' },
        customUserData: 'custom-data'
      },
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      setOutputs: jest.fn()
    }

    const inputs = {
      token: 'device-token',
      platformApplication: 'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name',
      attributes: { PlatformCredential: 'token' },
      customUserData: 'other-custom-data'
    }

    const outputs = await component.deploy(inputs, contextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createPlatformEndpointMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteEndpointMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toEqual(
      `${inputs.platformApplication}/00000000-0000-0000-0000-000000000000`
    )
    expect(contextMock.saveState).toHaveBeenCalledTimes(2)
  })

  it('should not remove or create a new sns platform endpoint when the token, platformApplication, attributes, and customUserData are same', async () => {
    const contextMock = {
      state: {
        endpointArn:
          'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name/00000000-0000-0000-0000-000000000000',
        token: 'device-token',
        platformApplication: 'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name',
        attributes: { PlatformCredential: 'token' },
        customUserData: 'custom-data'
      },
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      setOutputs: jest.fn()
    }

    const inputs = {
      token: 'device-token',
      platformApplication: 'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name',
      attributes: { PlatformCredential: 'token' },
      customUserData: 'custom-data'
    }

    const outputs = await component.deploy(inputs, contextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createPlatformEndpointMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteEndpointMock).toHaveBeenCalledTimes(0)
    expect(outputs.arn).toEqual(
      `${inputs.platformApplication}/00000000-0000-0000-0000-000000000000`
    )
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
  })

  it('should remove sns platform endpoint component', async () => {
    const contextMock = {
      state: {
        endpointArn:
          'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name/00000000-0000-0000-0000-000000000000',
        token: 'device-token',
        platformApplication: 'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name',
        attributes: { PlatformCredential: 'token' },
        customUserData: 'custom-data'
      },
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      setOutputs: jest.fn()
    }

    const inputs = {
      token: 'device-token',
      platformApplication: 'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name',
      attributes: { PlatformCredential: 'token' },
      customUserData: 'custom-data'
    }

    const outputs = await component.remove(inputs, contextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createPlatformEndpointMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteEndpointMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toBeUndefined()
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })
})
