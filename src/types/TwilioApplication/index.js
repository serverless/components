const { equals, pick } = require('@serverless/utils')

const applicationProps = [
  'accountSid',
  'apiVersion',
  'dateCreated',
  'dateUpdated',
  'authToken',
  'friendlyName',
  'messageStatusCallback',
  'sid',
  'smsFallbackMethod',
  'smsFallbackUrl',
  'smsMethod',
  'smsStatusCallback',
  'smsUrl',
  'statusCallback',
  'statusCallbackMethod',
  'uri',
  'voiceCallerIdLookup',
  'voiceFallbackMethod',
  'voiceFallbackUrl',
  'voiceMethod',
  'voiceUrl'
]

const inputsProps = [
  'provider',
  'friendlyName',
  'apiVersion',
  'voiceUrl',
  'voiceMethod',
  'voiceFallbackUrl',
  'voiceFallbackMethod',
  'statusCallback',
  'statusCallbackMethod',
  'voiceCallerIdLookup',
  'smsUrl',
  'smsMethod',
  'smsFallbackUrl',
  'smsFallbackMethod',
  'smsStatusCallback',
  'messageStatusCallback'
]

const createTwilioApplication = async (twilio, params) => {
  const application = await twilio.applications.create(params)
  return pick(applicationProps, application)
}

const updateTwilioApplication = async (twilio, params) => {
  const { sid, ...inputs } = params
  const application = await twilio.applications(sid).update(inputs)
  return pick(applicationProps, application)
}

const TwilioApplication = {
  async deploy(prevInstance, context) {
    const prevInputs = pick(inputsProps, prevInstance)
    const inputs = pick(inputsProps, this)
    const noChanges = equals(inputs, prevInputs)
    let state
    if (noChanges) {
      state = pick(applicationProps, prevInstance)
    } else if (!prevInstance.sid) {
      context.log(`Creating Twilio Application: "${inputs.friendlyName}"`)
      state = await createTwilioApplication(this.provider.getSdk(), inputs)
    } else {
      context.log(`Updating Twilio Application: "${inputs.friendlyName}"`)
      state = await updateTwilioApplication({
        ...inputs,
        sid: prevInstance.sid
      })
    }
    context.saveState(this, { ...state })
  },
  async remove(prevInstance, context) {
    context.log(`Removing Twilio Application: "${prevInstance.sid}"`)
    await this.provider
      .getSdk()
      .applications(prevInstance.sid)
      .remove()
    context.saveState(this, {})
  }
}

export default TwilioApplication
