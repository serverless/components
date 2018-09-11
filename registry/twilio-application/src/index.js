const twilio = require('twilio')
const { equals, pick } = require('ramda')

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

const prevInputsProps = [
  'accountSid',
  'friendlyName',
  'authToken',
  'messageStatusCallback',
  'smsFallbackMethod',
  'smsFallbackUrl',
  'smsMethod',
  'smsStatusCallback',
  'smsUrl',
  'statusCallback',
  'statusCallbackMethod',
  'voiceCallerIdLookup',
  'voiceFallbackMethod',
  'voiceFallbackUrl',
  'voiceMethod',
  'voiceUrl'
]

const createTwilioApplication = async (params) => {
  const { accountSid, authToken, ...inputs } = params

  const client = twilio(accountSid, authToken)
  const application = await client.applications.create(inputs)
  return pick(applicationProps, application)
}

const deleteTwilioApplication = async (params) => {
  const { accountSid, authToken, sid } = params

  const client = twilio(accountSid, authToken)
  await client.applications(sid).remove()

  // todo set all properties to null
  return {
    sid: null
  }
}

const updateTwilioApplication = async (params) => {
  const { accountSid, authToken, sid, ...inputs } = params
  const client = twilio(accountSid, authToken)
  const application = await client.applications(sid).update(inputs)
  return pick(applicationProps, application)
}

const deploy = async (inputs, context) => {
  const { sid, ...state } = context.state
  const prevInputs = pick(prevInputsProps, state)
  const noChanges = equals(inputs, prevInputs)
  let outputs
  if (noChanges) {
    outputs = context.state
  } else if (!sid) {
    context.log(`Creating Twilio Application: "${inputs.friendlyName}"`)
    outputs = await createTwilioApplication(inputs)
  } else {
    context.log(`Updating Twilio Application: "${inputs.friendlyName}"`)
    outputs = await updateTwilioApplication({
      ...inputs,
      sid
    })
  }
  context.saveState({ ...outputs })
  return outputs
}

const remove = async (inputs, context) => {
  context.log(`Removing Twilio Application: "${context.state.sid}"`)
  const outputs = await deleteTwilioApplication({
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
