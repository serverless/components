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

    if (noChanges) {
      return
    } else if (!prevInstance.sid) {
      context.log(`Creating Twilio Application: "${inputs.friendlyName}"`)
      return createTwilioApplication(this.provider.getSdk(), inputs)
    } else {
      context.log(`Updating Twilio Application: "${inputs.friendlyName}"`)
      return updateTwilioApplication({
        ...inputs,
        sid: prevInstance.sid
      })
    }
  },

  async remove(prevInstance, context) {
    context.log(`Removing Twilio Application: "${prevInstance.sid}"`)
    return this.provider
      .getSdk()
      .applications(prevInstance.sid)
      .remove()
  }
}

export default TwilioApplication
