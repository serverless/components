/* eslint-disable no-console */

const AWS = require('aws-sdk')

const sns = new AWS.SNS({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })

const { merge, equals, filter } = require('ramda')

const mapParams = (object) => {
  return filter((item) => typeof item !== 'undefined')({
    token: object.token,
    platformApplication: object.platformApplication,
    attributes: object.attributes,
    customUserData: object.customUserData
  })
}

const deploy = async (inputs, context) => {
  const { state } = context
  let endpointArn = state.endpointArn
  if (state.endpointArn && !equals(mapParams(inputs), mapParams(state))) {
    context.log(
      `To update the SNS Platform Endpoint with token '${
        inputs.token
      }', old version needs to be removed`
    )
    await remove(inputs, context)
    endpointArn = ''
  }

  if (!equals(mapParams(inputs), mapParams(state))) {
    context.log(`Creating a SNS Platform Endpoint with token '${inputs.token}'`)
    const { EndpointArn } = await sns
      .createPlatformEndpoint({
        PlatformApplicationArn: inputs.platformApplication,
        Token: inputs.token,
        Attributes: inputs.attributes,
        CustomUserData: inputs.customUserData
      })
      .promise()
    context.log(`SNS Platform Endpoint with token '${inputs.token}' created`)
    endpointArn = EndpointArn
    context.saveState(merge({ endpointArn }, inputs))
  } else {
    context.log(`No changes to the SNS Platform Endpoint with token '${inputs.token}'`)
  }

  return {
    arn: endpointArn
  }
}

const remove = async (inputs, context) => {
  const { state } = context
  context.log(`Removing the SNS Platform Endpoint with token '${state.token}'`)
  await sns
    .deleteEndpoint({
      EndpointArn: state.endpointArn
    })
    .promise()
  context.log(`SNS Platform Endpoint with token '${state.token}' removed`)
  await context.saveState({})

  return {}
}

module.exports = {
  deploy,
  remove
}
