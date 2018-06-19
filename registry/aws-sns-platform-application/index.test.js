/* eslint-disable no-console */

const AWS = require('aws-sdk')

const component = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    createPlatformApplicationMock: jest.fn((value) => ({
      PlatformApplicationArn: `arn:aws:sns:us-east-1:000000000000:app/${value.Platform}/${
        value.Name
      }`
    })),
    deletePlatformApplicationMock: jest.fn()
  }

  const SNS = {
    createPlatformApplication: (obj) => ({
      promise: () => mocks.createPlatformApplicationMock(obj)
    }),
    deletePlatformApplication: (obj) => ({
      promise: () => mocks.deletePlatformApplicationMock(obj)
    })
  }

  return {
    mocks,
    SNS: jest.fn().mockImplementation(() => SNS)
  }
})

afterEach(() => {
  AWS.mocks.createPlatformApplicationMock.mockClear()
  AWS.mocks.deletePlatformApplicationMock.mockClear()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('aws-sns-platform-application tests', () => {
  it('should deploy sns platform application component', async () => {
    const contextMock = {
      state: {},
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      setOutputs: jest.fn()
    }

    const inputs = {
      name: 'some-application-name',
      platform: 'PLT',
      attributes: { PlatformCredential: 'token' }
    }

    const outputs = await component.deploy(inputs, contextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createPlatformApplicationMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deletePlatformApplicationMock).toHaveBeenCalledTimes(0)
    expect(outputs.arn).toEqual(
      `arn:aws:sns:us-east-1:000000000000:app/${inputs.platform}/${inputs.name}`
    )
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should update sns platform application component with different name', async () => {
    const contextMock = {
      state: {
        platformApplicationArn: 'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name',
        name: 'some-application-name',
        platform: 'PLT',
        attributes: {
          PlatformCredential: 'secret-token'
        }
      },
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      setOutputs: jest.fn()
    }

    const inputs = {
      name: 'other-application-name',
      platform: 'PLT',
      attributes: { PlatformCredential: 'secret-token' }
    }

    const outputs = await component.deploy(inputs, contextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createPlatformApplicationMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deletePlatformApplicationMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toEqual(
      `arn:aws:sns:us-east-1:000000000000:app/${inputs.platform}/${inputs.name}`
    )
    expect(contextMock.saveState).toHaveBeenCalledTimes(2)
  })

  it('should update sns platform application component with different platform', async () => {
    const contextMock = {
      state: {
        platformApplicationArn: 'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name',
        name: 'some-application-name',
        platform: 'PLT',
        attributes: {
          PlatformCredential: 'secret-token'
        }
      },
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      setOutputs: jest.fn()
    }

    const inputs = {
      name: 'some-application-name',
      platform: 'PLT-2',
      attributes: { PlatformCredential: 'secret-token' }
    }

    const outputs = await component.deploy(inputs, contextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createPlatformApplicationMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deletePlatformApplicationMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toEqual(
      `arn:aws:sns:us-east-1:000000000000:app/${inputs.platform}/${inputs.name}`
    )
    expect(contextMock.saveState).toHaveBeenCalledTimes(2)
  })

  it('should update sns platform application component with different attributes', async () => {
    const contextMock = {
      state: {
        platformApplicationArn: 'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name',
        name: 'some-application-name',
        platform: 'PLT',
        attributes: {
          PlatformCredential: 'secret-token'
        }
      },
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      setOutputs: jest.fn()
    }

    const inputs = {
      name: 'some-application-name',
      platform: 'PLT',
      attributes: { PlatformCredential: 'secret-token-2' }
    }

    const outputs = await component.deploy(inputs, contextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createPlatformApplicationMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deletePlatformApplicationMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toEqual(
      `arn:aws:sns:us-east-1:000000000000:app/${inputs.platform}/${inputs.name}`
    )
    expect(contextMock.saveState).toHaveBeenCalledTimes(2)
  })

  it('should not remove or create a new sns platform application when the name, platform, and attributes are same', async () => {
    const contextMock = {
      state: {
        platformApplicationArn: 'arn:aws:sns:us-east-1:000000000000:app/PLT/some-application-name',
        name: 'some-application-name',
        platform: 'PLT',
        attributes: {
          PlatformCredential: 'secret-token'
        }
      },
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      setOutputs: jest.fn()
    }

    const inputs = {
      name: 'some-application-name',
      platform: 'PLT',
      attributes: { PlatformCredential: 'secret-token' }
    }

    const outputs = await component.deploy(inputs, contextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createPlatformApplicationMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deletePlatformApplicationMock).toHaveBeenCalledTimes(0)
    expect(outputs.arn).toEqual(
      `arn:aws:sns:us-east-1:000000000000:app/${inputs.platform}/${inputs.name}`
    )
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
  })

  it('should remove sns platform application component', async () => {
    const contextMock = {
      state: {
        platformApplicationArn: 'arn:aws:sns:us-east-1:000000000000:app/GCM/some-application-name',
        name: 'some-application-name',
        platform: 'PLT',
        attributes: {
          PlatformCredential: 'secret-token'
        }
      },
      archive: {},
      log: () => {},
      saveState: jest.fn(),
      setOutputs: jest.fn()
    }

    const inputs = {
      name: 'some-application-name',
      platform: 'PLT',
      attributes: { PlatformCredential: 'secret-token' }
    }

    const outputs = await component.remove(inputs, contextMock)

    expect(AWS.SNS).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createPlatformApplicationMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deletePlatformApplicationMock).toHaveBeenCalledTimes(1)
    expect(outputs.arn).toBeUndefined()
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })
})
