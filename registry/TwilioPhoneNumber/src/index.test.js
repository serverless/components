import crypto from 'crypto'
import path from 'path'
import twilio from 'twilio'
import { deserialize, resolveComponentEvaluables, serialize } from '../../../src/utils'
import createTestContext from '../../../test/createTestContext'

beforeEach(async () => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('TwilioPhoneNumber', () => {
  const cwd = path.resolve(__dirname, '..')
  let context
  let TwilioPhoneNumber
  let TwilioProvider

  beforeEach(async () => {
    context = await createTestContext({ cwd })
    TwilioPhoneNumber = await context.import('./')
    TwilioProvider = await context.import('TwilioProvider')
  })

  it('should create phone number if first deployment', async () => {
    const expectedSid = crypto
      .createHash('md5')
      .update('+1234567890')
      .digest('hex')
    let twilioPhoneNumber = await context.construct(TwilioPhoneNumber, {
      provider: await context.construct(TwilioProvider, {
        accountSid: 'accountSid',
        authToken: 'authToken'
      }),
      phoneNumber: '+1234567890'
    })
    twilioPhoneNumber = await context.defineComponent(twilioPhoneNumber)
    twilioPhoneNumber = resolveComponentEvaluables(twilioPhoneNumber)

    await twilioPhoneNumber.deploy(undefined, context)

    expect(twilioPhoneNumber.sid).toEqual(expectedSid)
    expect(twilio.mocks.incomingPhoneNumbersCreate).toHaveBeenCalled()
    expect(twilio.mocks.incomingPhoneNumbersList).toHaveBeenCalled()
  })

  it('should update phone number if friendlyName changes', async () => {
    let twilioPhoneNumber = await context.construct(TwilioPhoneNumber, {
      provider: await context.construct(TwilioProvider, {
        accountSid: 'accountSid',
        authToken: 'authToken'
      }),
      friendlyName: 'test',
      phoneNumber: '+1234567890'
    })
    twilioPhoneNumber = await context.defineComponent(twilioPhoneNumber)
    twilioPhoneNumber = resolveComponentEvaluables(twilioPhoneNumber)

    await twilioPhoneNumber.deploy(null, context)

    const prevTwilioPhoneNumber = await deserialize(serialize(twilioPhoneNumber, context), context)

    let nextTwilioPhoneNumber = await context.construct(TwilioPhoneNumber, {
      provider: await context.construct(TwilioProvider, {
        accountSid: 'accountSid',
        authToken: 'authToken'
      }),
      friendlyName: 'test-change',
      phoneNumber: '+1234567890'
    })
    nextTwilioPhoneNumber = await context.defineComponent(nextTwilioPhoneNumber)
    nextTwilioPhoneNumber = resolveComponentEvaluables(nextTwilioPhoneNumber)

    await nextTwilioPhoneNumber.deploy(prevTwilioPhoneNumber, context)

    expect(twilio.mocks.incomingPhoneNumbersUpdate).toBeCalledWith({
      friendlyName: 'test-change',
      phoneNumber: '+1234567890'
    })
  })

  it('should remove phone number', async () => {
    const expectedSid = crypto
      .createHash('md5')
      .update('+1234567890')
      .digest('hex')
    let twilioPhoneNumber = await context.construct(TwilioPhoneNumber, {
      provider: await context.construct(TwilioProvider, {
        accountSid: 'accountSid',
        authToken: 'authToken'
      }),
      phoneNumber: '+1234567890'
    })

    twilioPhoneNumber = await context.defineComponent(twilioPhoneNumber)
    twilioPhoneNumber = resolveComponentEvaluables(twilioPhoneNumber)

    await twilioPhoneNumber.deploy(null, context)

    jest.clearAllMocks()

    const prevTwilioPhoneNumber = await deserialize(serialize(twilioPhoneNumber, context), context)

    await prevTwilioPhoneNumber.remove(context)

    expect(twilio.mocks.incomingPhoneNumbers).toBeCalledWith(expectedSid)
    expect(twilio.mocks.incomingPhoneNumbersRemove).toHaveBeenCalled()
  })

  it('should NOT remove phone number if preserve is true', async () => {
    let twilioPhoneNumber = await context.construct(TwilioPhoneNumber, {
      provider: await context.construct(TwilioProvider, {
        accountSid: 'accountSid',
        authToken: 'authToken'
      }),
      preserve: true,
      phoneNumber: '+1234567890'
    })

    twilioPhoneNumber = await context.defineComponent(twilioPhoneNumber)
    twilioPhoneNumber = resolveComponentEvaluables(twilioPhoneNumber)

    await twilioPhoneNumber.deploy(null, context)

    jest.clearAllMocks()

    const prevTwilioPhoneNumber = await deserialize(serialize(twilioPhoneNumber, context), context)

    await prevTwilioPhoneNumber.remove(context)

    expect(twilio.mocks.incomingPhoneNumbers).not.toHaveBeenCalled()
    expect(twilio.mocks.incomingPhoneNumbersRemove).not.toHaveBeenCalled()
  })

  it('shouldDeploy should return undefined if nothing changed', async () => {
    let oldComponent = await context.construct(TwilioPhoneNumber, {
      provider: await context.construct(TwilioProvider, {
        accountSid: 'accountSid',
        authToken: 'authToken'
      }),
      phoneNumber: '+1234567890'
    })
    oldComponent = await context.defineComponent(oldComponent)
    oldComponent = resolveComponentEvaluables(oldComponent)
    await oldComponent.deploy(null, context)

    const prevComponent = await deserialize(serialize(oldComponent, context), context)

    let newComponent = await context.construct(TwilioPhoneNumber, {
      provider: await context.construct(TwilioProvider, {
        accountSid: 'accountSid',
        authToken: 'authToken'
      }),
      phoneNumber: '+1234567890'
    })
    newComponent = await context.defineComponent(newComponent)
    newComponent = resolveComponentEvaluables(newComponent)

    const res = newComponent.shouldDeploy(prevComponent)
    expect(res).toBe(undefined)
  })

  it('shouldDeploy should return "replace" if "phoneNumber" changed', async () => {
    let oldComponent = await context.construct(TwilioPhoneNumber, {
      provider: await context.construct(TwilioProvider, {
        accountSid: 'accountSid',
        authToken: 'authToken'
      }),
      phoneNumber: '+1987654320',
      friendlyName: 'friendlyName'
    })
    oldComponent = await context.defineComponent(oldComponent)
    oldComponent = resolveComponentEvaluables(oldComponent)
    await oldComponent.deploy(null, context)

    const prevComponent = await deserialize(serialize(oldComponent, context), context)

    let newComponent = await context.construct(TwilioPhoneNumber, {
      provider: await context.construct(TwilioProvider, {
        accountSid: 'accountSid',
        authToken: 'authToken'
      }),
      phoneNumber: '+1234567890',
      friendlyName: 'friendlyName'
    })
    newComponent = await context.defineComponent(newComponent)
    newComponent = resolveComponentEvaluables(newComponent)

    const res = newComponent.shouldDeploy(prevComponent)
    expect(res).toBe('replace')
  })

  it('shouldDeploy should return deploy if first deployment', async () => {
    let twilioPhoneNumber = await context.construct(TwilioPhoneNumber, {
      provider: await context.construct(TwilioProvider, {
        accountSid: 'accountSid',
        authToken: 'authToken'
      }),
      phoneNumber: '+1234567890',
      friendlyName: 'friendlyName'
    })
    twilioPhoneNumber = await context.defineComponent(twilioPhoneNumber)
    twilioPhoneNumber = resolveComponentEvaluables(twilioPhoneNumber)
    const res = twilioPhoneNumber.shouldDeploy(null, context)
    expect(res).toBe('deploy')
  })

  it('should preserve props if nothing changed', async () => {
    const inputs = {
      provider: await context.construct(TwilioProvider, {
        accountSid: 'accountSid',
        authToken: 'authToken'
      }),
      phoneNumber: '+1234567890',
      friendlyName: 'friendlyName'
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
