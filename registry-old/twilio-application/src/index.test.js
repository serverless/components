const twilio = require('twilio')
const twilioApplicationComponent = require('./index')

jest.mock('twilio')

const expectedOutputs = {
  accountSid: 'accountSid',
  apiVersion: 'apiVersion',
  dateCreated: 'dateCreated',
  dateUpdated: 'dateUpdated',
  friendlyName: 'friendlyName',
  authToken: 'authToken',
  messageStatusCallback: 'messageStatusCallback',
  sid: 'sid',
  smsFallbackMethod: 'smsFallbackMethod',
  smsFallbackUrl: 'smsFallbackUrl',
  smsMethod: 'smsMethod',
  smsStatusCallback: 'smsStatusCallback',
  smsUrl: 'smsUrl',
  statusCallback: 'statusCallback',
  statusCallbackMethod: 'statusCallbackMethod',
  uri: 'uri',
  voiceCallerIdLookup: 'voiceCallerIdLookup',
  voiceFallbackMethod: 'voiceFallbackMethod',
  voiceFallbackUrl: 'voiceFallbackUrl',
  voiceMethod: 'voiceMethod',
  voiceUrl: 'voiceUrl'
}

const updateMock = jest.fn().mockReturnValue(expectedOutputs)
const removeMock = jest.fn()

const twilioMock = {
  applications: () => {
    return {
      update: updateMock,
      remove: removeMock
    }
  }
}

twilioMock.applications.create = jest.fn().mockReturnValue(expectedOutputs)

twilio.mockImplementation(() => twilioMock)

afterAll(() => {
  jest.restoreAllMocks()
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('twilio-application unit tests', () => {
  it('should create application', async () => {
    const inputs = {
      accountSid: 'accountSid',
      friendlyName: 'friendlyName',
      authToken: 'authToken',
      messageStatusCallback: 'messageStatusCallback',
      smsFallbackMethod: 'smsFallbackMethod',
      smsFallbackUrl: 'smsFallbackUrl',
      smsMethod: 'smsMethod',
      smsStatusCallback: 'smsStatusCallback',
      smsUrl: 'smsUrl',
      statusCallback: 'statusCallback',
      statusCallbackMethod: 'statusCallbackMethod',
      voiceCallerIdLookup: 'voiceCallerIdLookup',
      voiceFallbackMethod: 'voiceFallbackMethod',
      voiceFallbackUrl: 'voiceFallbackUrl',
      voiceMethod: 'voiceMethod',
      voiceUrl: 'voiceUrl'
    }

    const expectedParams = {
      friendlyName: 'friendlyName',
      messageStatusCallback: 'messageStatusCallback',
      smsFallbackMethod: 'smsFallbackMethod',
      smsFallbackUrl: 'smsFallbackUrl',
      smsMethod: 'smsMethod',
      smsStatusCallback: 'smsStatusCallback',
      smsUrl: 'smsUrl',
      statusCallback: 'statusCallback',
      statusCallbackMethod: 'statusCallbackMethod',
      voiceCallerIdLookup: 'voiceCallerIdLookup',
      voiceFallbackMethod: 'voiceFallbackMethod',
      voiceFallbackUrl: 'voiceFallbackUrl',
      voiceMethod: 'voiceMethod',
      voiceUrl: 'voiceUrl'
    }

    const context = {
      state: {},
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const outputs = await twilioApplicationComponent.deploy(inputs, context)

    expect(twilio).toBeCalledWith('accountSid', 'authToken')
    expect(twilioMock.applications.create).toBeCalledWith(expectedParams)
    expect(context.saveState).toBeCalledWith(expectedOutputs)
    expect(outputs).toEqual(expectedOutputs)
  })

  it('should update application if changes detected', async () => {
    const inputs = {
      accountSid: 'accountSid',
      friendlyName: 'friendlyName',
      authToken: 'authToken',
      messageStatusCallback: 'messageStatusCallback',
      smsFallbackMethod: 'smsFallbackMethod',
      smsFallbackUrl: 'smsFallbackUrl',
      smsMethod: 'smsMethod',
      smsStatusCallback: 'smsStatusCallback',
      smsUrl: 'smsUrl',
      statusCallback: 'statusCallback',
      statusCallbackMethod: 'statusCallbackMethod',
      voiceCallerIdLookup: 'voiceCallerIdLookup',
      voiceFallbackMethod: 'voiceFallbackMethod',
      voiceFallbackUrl: 'voiceFallbackUrl',
      voiceMethod: 'voiceMethod',
      voiceUrl: 'voiceUrl'
    }

    const context = {
      state: expectedOutputs,
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const expectedParams = {
      friendlyName: 'friendlyName',
      messageStatusCallback: 'messageStatusCallback',
      smsFallbackMethod: 'smsFallbackMethod',
      smsFallbackUrl: 'smsFallbackUrl',
      smsMethod: 'newSmsMethod',
      smsStatusCallback: 'smsStatusCallback',
      smsUrl: 'smsUrl',
      statusCallback: 'statusCallback',
      statusCallbackMethod: 'statusCallbackMethod',
      voiceCallerIdLookup: 'voiceCallerIdLookup',
      voiceFallbackMethod: 'voiceFallbackMethod',
      voiceFallbackUrl: 'voiceFallbackUrl',
      voiceMethod: 'voiceMethod',
      voiceUrl: 'voiceUrl'
    }

    inputs.smsMethod = 'newSmsMethod'

    const outputs = await twilioApplicationComponent.deploy(inputs, context)

    expect(twilio).toBeCalledWith('accountSid', 'authToken')
    expect(updateMock).toBeCalledWith(expectedParams)
    expect(context.saveState).toBeCalledWith(outputs)
    expect(outputs).toEqual(expectedOutputs)
  })

  it('should not update application if no changes detected', async () => {
    const inputs = {
      accountSid: 'accountSid',
      friendlyName: 'friendlyName',
      authToken: 'authToken',
      messageStatusCallback: 'messageStatusCallback',
      smsFallbackMethod: 'smsFallbackMethod',
      smsFallbackUrl: 'smsFallbackUrl',
      smsMethod: 'smsMethod',
      smsStatusCallback: 'smsStatusCallback',
      smsUrl: 'smsUrl',
      statusCallback: 'statusCallback',
      statusCallbackMethod: 'statusCallbackMethod',
      voiceCallerIdLookup: 'voiceCallerIdLookup',
      voiceFallbackMethod: 'voiceFallbackMethod',
      voiceFallbackUrl: 'voiceFallbackUrl',
      voiceMethod: 'voiceMethod',
      voiceUrl: 'voiceUrl'
    }

    const context = {
      state: {
        ...expectedOutputs
      },
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const outputs = await twilioApplicationComponent.deploy(inputs, context)

    expect(twilio).not.toHaveBeenCalled()
    expect(updateMock).not.toHaveBeenCalled()
    expect(context.saveState).toBeCalledWith(context.state)
    expect(outputs).toEqual(context.state)
  })

  it('should remove application', async () => {
    const inputs = {
      accountSid: 'accountSid',
      friendlyName: 'friendlyName',
      authToken: 'authToken',
      messageStatusCallback: 'messageStatusCallback',
      smsFallbackMethod: 'smsFallbackMethod',
      smsFallbackUrl: 'smsFallbackUrl',
      smsMethod: 'smsMethod',
      smsStatusCallback: 'smsStatusCallback',
      smsUrl: 'smsUrl',
      statusCallback: 'statusCallback',
      statusCallbackMethod: 'statusCallbackMethod',
      voiceCallerIdLookup: 'voiceCallerIdLookup',
      voiceFallbackMethod: 'voiceFallbackMethod',
      voiceFallbackUrl: 'voiceFallbackUrl',
      voiceMethod: 'voiceMethod',
      voiceUrl: 'voiceUrl'
    }

    const context = {
      state: expectedOutputs,
      archive: {},
      log: () => {},
      saveState: () => {}
    }

    const outputs = await twilioApplicationComponent.remove(inputs, context)

    expect(twilio).toBeCalledWith('accountSid', 'authToken')
    expect(twilioMock.applications().remove).toHaveBeenCalled()
    expect(outputs).toEqual({
      sid: null
    })
  })
})
