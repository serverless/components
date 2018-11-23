import path from 'path'
import { resolveComponentEvaluables, serialize, deserialize } from '@serverless/utils'
import { createContext } from '../../../src/utils'

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

afterAll(() => {
  jest.restoreAllMocks()
})

beforeEach(() => {
  jest.clearAllMocks()
})

const provider = {
  getSdk: () => twilioMock
}

describe.skip('TwilioApplication', () => {
  it('should return if no changes detected', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()
    const inputs = {
      provider,
      friendlyName: 'hello',
      apiVersion: 'foo',
      voiceUrl: 'foo',
      voiceMethod: 'foo',
      voiceFallbackUrl: 'foo',
      voiceFallbackMethod: 'foo',
      statusCallback: 'foo',
      statusCallbackMethod: 'foo',
      voiceCallerIdLookup: 'foo',
      smsUrl: 'foo',
      smsMethod: 'foo',
      smsFallbackUrl: 'foo',
      smsFallbackMethod: 'foo',
      smsStatusCallback: 'foo',
      messageStatusCallback: 'foo'
    }

    const TwilioApplication = await context.import('./')
    const twilioApplication = await context.construct(TwilioApplication, {})

    Object.assign(twilioApplication, inputs)

    await twilioApplication.deploy({ inputs }, context)

    expect(twilioMock.applications.create).not.toHaveBeenCalled()
    expect(updateMock).not.toHaveBeenCalled()
    expect(removeMock).not.toHaveBeenCalled()
  })

  it('should create application', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()
    const inputs = {
      provider,
      friendlyName: 'hello',
      apiVersion: 'foo',
      voiceUrl: 'foo',
      voiceMethod: 'foo',
      voiceFallbackUrl: 'foo',
      voiceFallbackMethod: 'foo',
      statusCallback: 'foo',
      statusCallbackMethod: 'foo',
      voiceCallerIdLookup: 'foo',
      smsUrl: 'foo',
      smsMethod: 'foo',
      smsFallbackUrl: 'foo',
      smsFallbackMethod: 'foo',
      smsStatusCallback: 'foo',
      messageStatusCallback: 'foo'
    }

    const TwilioApplication = await context.import('./')
    const twilioApplication = await context.construct(TwilioApplication, {})

    Object.assign(twilioApplication, inputs)

    await twilioApplication.deploy(undefined, context)

    expect(twilioMock.applications.create).toBeCalledWith(inputs)
    expect(twilioApplication.sid).toEqual('sid')
    expect(twilioApplication.dateCreated).toEqual('dateCreated')
    expect(twilioApplication.dateUpdated).toEqual('dateUpdated')
    expect(updateMock).not.toHaveBeenCalled()
    expect(removeMock).not.toHaveBeenCalled()
  })

  it('should update application', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()
    const inputs = {
      provider,
      friendlyName: 'hello',
      apiVersion: 'foo',
      voiceUrl: 'foo',
      voiceMethod: 'foo',
      voiceFallbackUrl: 'foo',
      voiceFallbackMethod: 'foo',
      statusCallback: 'foo',
      statusCallbackMethod: 'foo',
      voiceCallerIdLookup: 'foo',
      smsUrl: 'foo',
      smsMethod: 'foo',
      smsFallbackUrl: 'foo',
      smsFallbackMethod: 'foo',
      smsStatusCallback: 'foo',
      messageStatusCallback: 'foo'
    }

    const TwilioApplication = await context.import('./')
    const twilioApplication = await context.construct(TwilioApplication, {})

    Object.assign(twilioApplication, inputs)

    await twilioApplication.deploy({ sid: 'sid' }, context)

    expect(updateMock).toBeCalledWith(inputs)
    expect(twilioApplication.sid).toEqual('sid')
    expect(twilioApplication.dateCreated).toEqual('dateCreated')
    expect(twilioApplication.dateUpdated).toEqual('dateUpdated')
    expect(twilioMock.applications.create).not.toHaveBeenCalled()
    expect(removeMock).not.toHaveBeenCalled()
  })

  it('should remove application', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()
    const inputs = {
      provider,
      friendlyName: 'hello',
      sid: 'sid',
      apiVersion: 'foo',
      voiceUrl: 'foo',
      voiceMethod: 'foo',
      voiceFallbackUrl: 'foo',
      voiceFallbackMethod: 'foo',
      statusCallback: 'foo',
      statusCallbackMethod: 'foo',
      voiceCallerIdLookup: 'foo',
      smsUrl: 'foo',
      smsMethod: 'foo',
      smsFallbackUrl: 'foo',
      smsFallbackMethod: 'foo',
      smsStatusCallback: 'foo',
      messageStatusCallback: 'foo'
    }

    const TwilioApplication = await context.import('./')
    const twilioApplication = await context.construct(TwilioApplication, {})

    Object.assign(twilioApplication, inputs)

    await twilioApplication.remove(context)

    expect(removeMock).toHaveBeenCalled()
    expect(updateMock).not.toHaveBeenCalled()
    expect(twilioMock.applications.create).not.toHaveBeenCalled()
  })

  it('should preserve props if nothing changed', async () => {
    const context = await createContext({
      cwd: path.join(__dirname, '..')
    })
    const inputs = {
      provider: provider,
      friendlyName: 'hello',
      sid: 'sid',
      apiVersion: 'foo',
      voiceUrl: 'foo',
      voiceMethod: 'foo',
      voiceFallbackUrl: 'foo',
      voiceFallbackMethod: 'foo',
      statusCallback: 'foo',
      statusCallbackMethod: 'foo',
      voiceCallerIdLookup: 'foo',
      smsUrl: 'foo',
      smsMethod: 'foo',
      smsFallbackUrl: 'foo',
      smsFallbackMethod: 'foo',
      smsStatusCallback: 'foo',
      messageStatusCallback: 'foo'
    }
    const ComponentType = await context.import('./')
    let oldComponent = await context.construct(ComponentType, inputs)
    oldComponent = await context.defineComponent(oldComponent)
    oldComponent = resolveComponentEvaluables(oldComponent)
    await oldComponent.deploy(null, context)

    const prevComponent = await deserialize(serialize(oldComponent, context), context)

    let newComponent = await context.construct(ComponentType, inputs)
    newComponent = await context.defineComponent(newComponent, prevComponent)
    newComponent = resolveComponentEvaluables(newComponent)

    expect(newComponent).toEqual(prevComponent)
  })
})
