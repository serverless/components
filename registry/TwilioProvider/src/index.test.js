import twilio from 'twilio'
import path from 'path'
import { createContext } from '../../../src/utils'

jest.mock('twilio', () => jest.fn().mockReturnValue({ twilio: 'sdk' }))

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('TwilioProvider', () => {
  it('should getCredentials', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const inputs = {
      accountSid: 'accountSid',
      authToken: 'authToken'
    }

    const TwilioProvider = await context.import('./')
    const twilioProvider = await context.construct(TwilioProvider, inputs)

    expect(twilioProvider.getCredentials().get()).toEqual(inputs)
  })

  it('should getSdk', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const inputs = {
      accountSid: 'accountSid',
      authToken: 'authToken'
    }

    const TwilioProvider = await context.import('./')
    const twilioProvider = await context.construct(TwilioProvider, inputs)

    const sdk = twilioProvider.getSdk()

    expect(sdk).toEqual({ twilio: 'sdk' })
    expect(twilio).toBeCalledWith(inputs.accountSid, inputs.authToken)
  })
})
