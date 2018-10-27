const { equals, isEmpty, pick } = require('@serverless/utils')

const phoneNumberProps = [
  'addressRequirements',
  'apiVersion',
  'beta',
  'capabilities',
  'dateCreated',
  'dateUpdated',
  'friendlyName',
  'identitySid',
  'phoneNumber',
  'origin',
  'sid',
  'smsApplicationSid',
  'smsFallbackMethod',
  'smsFallbackUrl',
  'smsMethod',
  'smsUrl',
  'statusCallback',
  'statusCallbackMethod',
  'trunkSid',
  'uri',
  'voiceApplicationSid',
  'voiceCallerIdLookup',
  'voiceFallbackMethod',
  'voiceFallbackUrl',
  'voiceMethod',
  'voiceUrl',
  'emergencyStatus',
  'emergencyAddressSid'
]

const inputsProps = [
  'phoneNumber',
  'areaCode',
  'friendlyName',
  'apiVersion',
  'voiceUrl',
  'voiceMethod',
  'voiceFallbackUrl',
  'voiceFallbackMethod',
  'voiceCallerIdLookup',
  'voiceApplicationSid',
  'trunkSid',
  'smsUrl',
  'smsMethod',
  'smsFallbackUrl',
  'smsFallbackMethod',
  'smsApplicationSid',
  'addressSid'
]

const updatePhoneNumber = async (twilio, params) => {
  const { sid, ...inputs } = params
  const phoneNumber = await twilio.incomingPhoneNumbers(sid).update(inputs)
  return pick(phoneNumberProps, phoneNumber)
}

const createPhoneNumber = async (twilio, params) => {
  if (params.phoneNumber) {
    const exists = await twilio.incomingPhoneNumbers.list({
      phoneNumber: params.phoneNumber
    })
    if (!isEmpty(exists)) {
      return updatePhoneNumber(twilio, {
        ...params,
        sid: exists[0].sid
      })
    }
  }
  const phoneNumber = await twilio.incomingPhoneNumbers.create(params)
  return pick(phoneNumberProps, phoneNumber)
}

const TwilioPhoneNumber = {
  async deploy(prevInstance, context) {
    const inputs = pick(inputsProps, this)
    if (!prevInstance) {
      context.log(`Creating Twilio Phone Number: "${inputs.friendlyName || inputs.phoneNumber}"`)
      const props = await createPhoneNumber(this.provider.getSdk(), inputs)
      Object.assign(this, props)
    } else {
      const prevInputs = pick(inputsProps, prevInstance)
      const noChanges = equals(prevInputs, inputs)

      if (noChanges) {
        return
      }
      context.log(`Updating Twilio Phone Number: "${inputs.friendlyName}"`)
      const props = await updatePhoneNumber(this.provider.getSdk(), {
        ...inputs,
        sid: prevInstance.sid
      })
      Object.assign(this, props)
    }
  },

  async remove(context) {
    context.log(`Removing Twilio Phone Number: "${this.sid}"`)
    return this.provider
      .getSdk()
      .incomingPhoneNumbers(this.sid)
      .remove()
  }
}

export default TwilioPhoneNumber
