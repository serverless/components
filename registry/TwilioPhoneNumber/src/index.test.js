import path from 'path'
import { createContext } from '../../../src/utils'

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
twilioMock.incomingPhoneNumbers.list = jest.fn().mockReturnValue([])

afterAll(() => {
  jest.restoreAllMocks()
})

beforeEach(() => {
  jest.clearAllMocks()
})

const provider = {
  getSdk: () => twilioMock
}

describe('TwilioPhoneNumber', () => {
  it('should create phone number if first deployment', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const TwilioPhoneNumber = await context.loadType('./')
    const twilioPhoneNumber = await context.construct(TwilioPhoneNumber, {})

    twilioPhoneNumber.provider = provider
    twilioPhoneNumber.phoneNumber = '+1234567890'

    await twilioPhoneNumber.deploy(undefined, context)

    expect(twilioPhoneNumber.sid).toEqual(expectedOutputs.sid)
    expect(twilioMock.incomingPhoneNumbers.create).toHaveBeenCalled()
    expect(twilioMock.incomingPhoneNumbers.list).toHaveBeenCalled()
  })

  it('should update phone number if not first deployment', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const TwilioPhoneNumber = await context.loadType('./')
    const twilioPhoneNumber = await context.construct(TwilioPhoneNumber, {})

    twilioPhoneNumber.provider = provider
    twilioPhoneNumber.phoneNumber = '+1234567890'

    await twilioPhoneNumber.deploy({ sid: 'sid' }, context)

    expect(twilioPhoneNumber.sid).toEqual(expectedOutputs.sid)
    expect(updateMock).toHaveBeenCalled()
  })

  it('should remove phone number', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const TwilioPhoneNumber = await context.loadType('./')
    const twilioPhoneNumber = await context.construct(TwilioPhoneNumber, {})

    twilioPhoneNumber.provider = provider
    twilioPhoneNumber.sid = 'sid'

    await twilioPhoneNumber.remove(context)

    expect(removeMock).toHaveBeenCalled()
  })
})
