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
  // 'provider',
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

const TwilioApplication = (SuperClass) =>
  class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)
      // this does not work with twilio
      // this.provider = inputs.provider
      // this.friendlyName = inputs.friendlyName
      // this.apiVersion = inputs.apiVersion || '2010-04-01'
      // this.voiceUrl = inputs.voiceUrl || null
      // this.voiceMethod = inputs.voiceMethod || 'POST'
      // this.voiceFallbackUrl = inputs.voiceFallbackUrl || null
      // this.voiceFallbackMethod = inputs.voiceFallbackMethod || 'POST'
      // this.statusCallback = inputs.statusCallback || null
      // this.statusCallbackMethod = inputs.statusCallbackMethod || 'POST'
      // this.voiceCallerIdLookup = inputs.voiceCallerIdLookup || false
      // this.smsUrl = inputs.smsUrl || null
      // this.smsMethod = inputs.smsMethod || 'POST'
      // this.smsFallbackUrl = inputs.smsFallbackUrl || null
      // this.smsFallbackMethod = inputs.smsFallbackMethod || 'POST'
      // this.smsStatusCallback = inputs.smsStatusCallback || null
      // this.messageStatusCallback = inputs.messageStatusCallback || null
    }

    async deploy(prevInstance = {}, context) {
      const inputs = pick(inputsProps, this)
      const prevInputs = pick(inputsProps, prevInstance)
      const noChanges = equals(inputs, prevInputs)

      if (noChanges) {
        return
      } else if (!prevInstance.sid) {
        context.log(`Creating Twilio Application: "${this.friendlyName}"`)
        const props = await createTwilioApplication(this.provider.getSdk(), inputs)
        Object.assign(this, props)
      } else {
        context.log(`Updating Twilio Application: "${this.friendlyName}"`)
        const props = await updateTwilioApplication(this.provider.getSdk(), {
          ...inputs,
          sid: prevInstance.sid
        })
        Object.assign(this, props)
      }
    }

    async remove(context) {
      context.log(`Removing Twilio Application: "${this.sid}"`)
      return this.provider
        .getSdk()
        .applications(this.sid)
        .remove()
    }
  }

export default TwilioApplication
