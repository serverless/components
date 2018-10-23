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
  'provider',
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
    const prevInputs = prevInstance ? pick(inputsProps, prevInstance) : {}
    const inputs = pick(inputsProps, this)
    const noChanges = equals(prevInputs, inputs)

    if (noChanges) {
      return
    } else if (!prevInstance.sid) {
      context.log(`Creating Twilio Phone Number: "${inputs.friendlyName}"`)
      return createPhoneNumber(this.provider.getSdk(), inputs)
    }
    context.log(`Updating Twilio Phone Number: "${inputs.friendlyName}"`)
    return await updatePhoneNumber(this.provider.getSdk(), {
      ...inputs,
      sid: prevInstance.sid
    })
  },

  async remove(prevInstance, context) {
    context.log(`Removing Twilio Phone Number: "${prevInstance.sid}"`)
    return this.provider
      .getSdk()
      .incomingPhoneNumbers(prevInstance.sid)
      .remove()
  }
}

export default TwilioPhoneNumber
