import { merge } from '@serverless/utils'
import path from 'path'
import {
  deserialize,
  resolveComponentEvaluables,
  serialize
} from '../../../src/utils'
import createTestContext from '../../../test/createTestContext'

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

let context
let ComponentType

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

beforeEach(async () => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

const provider = {
  getSdk: () => twilioMock
}

describe('TwilioPhoneNumber', () => {
  const cwd = path.resolve(__dirname, '..')
  let context
  let TwilioPhoneNumber

  beforeEach(async () => {
    context = await createTestContext({ cwd })
    context = await context.loadProject()
    context = await context.loadApp()
    TwilioPhoneNumber = await context.loadType('./')
  })

  it('should create phone number if first deployment', async () => {
    let twilioPhoneNumber = await context.construct(TwilioPhoneNumber, {
      provider,
      phoneNumber: '+1234567890'
    })
    twilioPhoneNumber = await context.define(twilioPhoneNumber)
    twilioPhoneNumber = resolveComponentEvaluables(twilioPhoneNumber)
    
    await twilioPhoneNumber.deploy(undefined, context)

    expect(twilioPhoneNumber.sid).toEqual(expectedOutputs.sid)
    expect(twilioMock.incomingPhoneNumbers.create).toHaveBeenCalled()
    expect(twilioMock.incomingPhoneNumbers.list).toHaveBeenCalled()
  })

  it('should update phone number if not first deployment', async () => {
    const twilioPhoneNumber = await context.construct(TwilioPhoneNumber, {
      provider,
      phoneNumber: '+1234567890'
    })
    twilioPhoneNumber = await context.define(twilioPhoneNumber)
    twilioPhoneNumber = resolveComponentEvaluables(twilioPhoneNumber)
    
    await twilioPhoneNumber.deploy({ sid: 'sid' }, context)

    
    expect(twilioPhoneNumber.sid).toEqual(expectedOutputs.sid)
    expect(updateMock).toHaveBeenCalled()
  })

  it('should remove phone number', async () => {
    const twilioPhoneNumber = await context.construct(TwilioPhoneNumber, {})

    twilioPhoneNumber.provider = provider
    twilioPhoneNumber.sid = 'sid'

    await twilioPhoneNumber.remove(context)

    expect(removeMock).toHaveBeenCalled()
  })

  it('shouldDeploy should return undefined if nothing changed', async () => {
    let oldComponent = await context.construct(ComponentType, merge(expectedOutputs, { provider }))
    oldComponent = await context.defineComponent(oldComponent)
    oldComponent = resolveComponentEvaluables(oldComponent)
    await oldComponent.deploy(null, context)

    const prevComponent = await deserialize(serialize(oldComponent, context), context)

    let newComponent = await context.construct(ComponentType, merge(expectedOutputs, { provider }))
    newComponent = await context.defineComponent(newComponent)
    newComponent = resolveComponentEvaluables(newComponent)

    const res = newComponent.shouldDeploy(prevComponent)
    expect(res).toBe(undefined)
  })

  it('shouldDeploy should return "replace" if "topic" changed', async () => {
    let oldComponent = await context.construct(ComponentType, {
      provider,
      phoneNumber: 'phoneNumber',
      friendlyName: 'friendlyName'
    })
    oldComponent = await context.defineComponent(oldComponent)
    oldComponent = resolveComponentEvaluables(oldComponent)
    await oldComponent.deploy(null, context)

    const prevComponent = await deserialize(serialize(oldComponent, context), context)

    let newComponent = await context.construct(ComponentType, {
      provider,
      phoneNumber: '+1234566890',
      friendlyName: 'friendlyName'
    })
    newComponent = await context.defineComponent(newComponent)
    newComponent = resolveComponentEvaluables(newComponent)

    const res = newComponent.shouldDeploy(prevComponent)
    expect(res).toBe('replace')
  })

  it('shouldDeploy should return deploy if first deployment', async () => {
    context = await createContext({ cwd: __dirname }, { app: { id: 'test' } })
    let oldComponent = await context.construct(ComponentType, {
      provider,
      phoneNumber: 'phoneNumber',
      friendlyName: 'friendlyName'
    })
    oldComponent = await context.defineComponent(oldComponent)
    oldComponent = resolveComponentEvaluables(oldComponent)
    const res = oldComponent.shouldDeploy(null, context)
    expect(res).toBe('deploy')
  })
})
