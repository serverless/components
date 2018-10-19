const twilio = require('twilio')
const { equals, isEmpty, pick } = require('ramda')

const phoneNumberProps = [
  'accountSid',
  'addressSid',
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

const updatePhoneNumber = async (params) => {
  const { accountSid, authToken, sid, ...inputs } = params

  const client = twilio(accountSid, authToken)
  const phoneNumber = await client.incomingPhoneNumbers(sid).update(inputs)
  return pick(phoneNumberProps, phoneNumber)
}

const createPhoneNumber = async (params) => {
  const { accountSid, authToken, ...inputs } = params

  const client = twilio(accountSid, authToken)

  if (inputs.phoneNumber) {
    const exists = await client.incomingPhoneNumbers.list({
      phoneNumber: inputs.phoneNumber
    })
    if (!isEmpty(exists)) {
      return updatePhoneNumber({
        ...inputs,
        accountSid,
        authToken,
        sid: exists[0].sid
      })
    }
  }
  const phoneNumber = await client.incomingPhoneNumbers.create(inputs)
  return pick(phoneNumberProps, phoneNumber)
}

const deletePhoneNumber = async (params) => {
  const { accountSid, authToken, sid } = params

  const client = twilio(accountSid, authToken)
  await client.incomingPhoneNumbers(sid).remove()
  return {
    sid: null
  }
}

const deploy = async (inputs, context) => {
  const { sid, ...state } = context.state
  const noChanges = equals(inputs, state)
  let outputs
  if (noChanges) {
    outputs = context.state
  } else if (!sid) {
    context.log(`Creating Twilio Phone Number: "${inputs.friendlyName}"`)
    outputs = await createPhoneNumber(inputs)
  } else {
    context.log(`Updating Twilio Phone Number: "${inputs.friendlyName}"`)
    outputs = await updatePhoneNumber({
      ...inputs,
      sid
    })
  }
  outputs.authToken = inputs.authToken
  context.saveState({ ...outputs })
  return outputs
}

const remove = async (inputs, context) => {
  context.log(`Removing Twilio Phone Number: "${context.state.sid}"`)
  const outputs = await deletePhoneNumber({
    accountSid: context.state.accountSid,
    authToken: context.state.authToken,
    sid: context.state.sid
  })
  return outputs
}

module.exports = {
  deploy,
  remove
}
