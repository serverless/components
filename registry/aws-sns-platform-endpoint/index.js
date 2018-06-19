/* eslint-disable no-console */

const AWS = require('aws-sdk')

const sns = new AWS.SNS({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })

const { merge, equals, filter } = require('ramda')

const contextSetOutputs = (context) => {
  context.setOutputs = (output) => {
    console.warn('*** temp setout', output)
    return output // dummy output remove after PR #223
  }
}

const mapParams = (object) => {
  return filter((item) => typeof item !== 'undefined')({
    token: object.token,
    platformApplication: object.platformApplication,
    attributes: object.attributes,
    customUserData: object.customUserData
  })
}

const deploy = async (inputs, context) => {
  contextSetOutputs(context) // REMOVE
  const { state } = context
  let endpointArn = state.endpointArn
  // console.log('PARAMS', mapParams(inputs), mapParams(state))
  if (state.endpointArn && !equals(mapParams(inputs), mapParams(state))) {
    context.log(`TBD to update ${inputs.name} old one needs to be removed first`)
    await remove(inputs, context)
    endpointArn = ''
  }

  if (!equals(mapParams(inputs), mapParams(state))) {
    context.log(`TBD creating ${inputs.token} endpoint to ${inputs.platformApplication}`)
    const { EndpointArn } = await sns
      .createPlatformEndpoint({
        PlatformApplicationArn: inputs.platformApplication,
        Token: inputs.token,
        Attributes: inputs.attributes,
        CustomUserData: inputs.customUserData
      })
      .promise()
    endpointArn = EndpointArn
    context.saveState(merge({ endpointArn }, inputs))
  } else {
    context.log(`TBD no changes to ${inputs.token} endpoint in ${inputs.platformApplication}`)
  }

  return context.setOutputs({
    arn: endpointArn
  })
}

const remove = async (inputs, context) => {
  contextSetOutputs(context) // REMOVE
  const { state } = context
  context.log(`TBD removing ${state.endpointArn}`)
  await sns
    .deleteEndpoint({
      EndpointArn: state.endpointArn
    })
    .promise()
  context.log(`TBD removed ${state.endpointArn}`)
  await context.saveState({})
  return context.setOutputs({})
}

module.exports = {
  deploy,
  remove
}
