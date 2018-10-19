const twilio = require('twilio')
const twilioPhoneNumberComponent = require('./index')

jest.mock('twilio')

const expectedOutputs = {
  accountSid: 'accountSid',
  authToken: 'authToken',
  addressRequirements: 'addressRequirements',
  addressSid: 'addressSid',
  apiVersion: 'apiVersion',
  beta: 'beta',
  capabilities: 'capabilities',
  dateCreated: 'dateCreated',
  dateUpdated: 'dateUpdated',
  emergencyAddressSid: 'emergencyAddressSid',
  emergencyStatus: 'emergencyStatus',
  friendlyName: 'friendlyName',
  identitySid: 'identitySid',
  origin: 'origin',
  phoneNumber: 'phoneNumber',
  sid: 'sid',
  smsApplicationSid: 'smsApplicationSid',
  smsFallbackMethod: 'smsFallbackMethod',
  smsFallbackUrl: 'smsFallbackUrl',
  smsMethod: 'smsMethod',
  smsUrl: 'smsUrl',
  statusCallback: 'statusCallback',
  statusCallbackMethod: 'statusCallbackMethod',
  trunkSid: 'trunkSid',
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
  incomingPhoneNumbers: () => {
    return {
      update: updateMock,
      remove: removeMock
    }
  }
}

twilioMock.incomingPhoneNumbers.create = jest.fn().mockReturnValue(expectedOutputs)

twilio.mockImplementation(() => twilioMock)

afterAll(() => {
  jest.restoreAllMocks()
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('twilio-phone-number unit tests', () => {
  it('should create phone number', async () => {
    twilioMock.incomingPhoneNumbers.list = jest.fn().mockReturnValue([])

    const inputs = {
      accountSid: 'accountSid',
      friendlyName: 'friendlyName',
      authToken: 'authToken',
      phoneNumber: 'phoneNumber',
      areaCode: 'areaCode',
      trunkSid: 'trunkSid',
      addressSid: 'addressSid',
      messageStatusCallback: 'messageStatusCallback',
      smsFallbackMethod: 'smsFallbackMethod',
      smsFallbackUrl: 'smsFallbackUrl',
      smsMethod: 'smsMethod',
      smsStatusCallback: 'smsStatusCallback',
      smsUrl: 'smsUrl',
      smsApplicationSid: 'smsApplicationSid',
      statusCallback: 'statusCallback',
      statusCallbackMethod: 'statusCallbackMethod',
      voiceCallerIdLookup: 'voiceCallerIdLookup',
      voiceApplicationSid: 'voiceApplicationSid',
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

    const expectedParams = {
      addressSid: 'addressSid',
      areaCode: 'areaCode',
      friendlyName: 'friendlyName',
      messageStatusCallback: 'messageStatusCallback',
      phoneNumber: 'phoneNumber',
      smsApplicationSid: 'smsApplicationSid',
      smsFallbackMethod: 'smsFallbackMethod',
      smsFallbackUrl: 'smsFallbackUrl',
      smsMethod: 'smsMethod',
      smsStatusCallback: 'smsStatusCallback',
      smsUrl: 'smsUrl',
      statusCallback: 'statusCallback',
      statusCallbackMethod: 'statusCallbackMethod',
      trunkSid: 'trunkSid',
      voiceApplicationSid: 'voiceApplicationSid',
      voiceCallerIdLookup: 'voiceCallerIdLookup',
      voiceFallbackMethod: 'voiceFallbackMethod',
      voiceFallbackUrl: 'voiceFallbackUrl',
      voiceMethod: 'voiceMethod',
      voiceUrl: 'voiceUrl'
    }

    const outputs = await twilioPhoneNumberComponent.deploy(inputs, context)

    expect(twilio).toBeCalledWith('accountSid', 'authToken')
    expect(twilioMock.incomingPhoneNumbers.create).toBeCalledWith(expectedParams)
    expect(context.saveState).toBeCalledWith(expectedOutputs)
    expect(outputs).toEqual(expectedOutputs)
  })

  it('should update phone number if changes detected', async () => {
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

    const context = {
      state: expectedOutputs,
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    inputs.smsMethod = 'newSmsMethod'

    const outputs = await twilioPhoneNumberComponent.deploy(inputs, context)

    expect(twilio).toBeCalledWith('accountSid', 'authToken')
    expect(twilioMock.incomingPhoneNumbers().update).toBeCalledWith(expectedParams)
    expect(context.saveState).toBeCalledWith(outputs)
    expect(outputs).toEqual(expectedOutputs)
  })

  it('should not update phone number if no changes detected', async () => {
    const inputs = {
      accountSid: 'accountSid',
      authToken: 'authToken'
    }

    const context = {
      state: inputs,
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const outputs = await twilioPhoneNumberComponent.deploy(inputs, context)

    expect(twilio).not.toHaveBeenCalled()
    expect(updateMock).not.toHaveBeenCalled()
    expect(context.saveState).toBeCalledWith(context.state)
    expect(outputs).toEqual(context.state)
  })

  it('should remove phone number', async () => {
    const inputs = {
      accountSid: 'accountSid',
      authToken: 'authToken'
    }

    const context = {
      state: {
        ...inputs,
        sid: 'sid'
      },
      archive: {},
      log: () => {},
      saveState: () => {}
    }

    const outputs = await twilioPhoneNumberComponent.remove(inputs, context)

    expect(twilio).toBeCalledWith('accountSid', 'authToken')
    expect(twilioMock.incomingPhoneNumbers().remove).toHaveBeenCalled()
    expect(outputs).toEqual({
      sid: null
    })
  })
})
