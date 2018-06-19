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
    name: object.name,
    platform: object.platform,
    attributes: object.attributes
  })
}

const deploy = async (inputs, context) => {
  contextSetOutputs(context) // REMOVE
  const { state } = context
  let platformApplicationArn = state.platformApplicationArn
  if (platformApplicationArn && !equals(mapParams(inputs), mapParams(state))) {
    context.log(`TBD to update ${inputs.name} old one needs to be removed first`)
    await remove(inputs, context)
  }
  if (!equals(mapParams(inputs), mapParams(state))) {
    context.log(`TBD creating ${inputs.name}`)
    const { PlatformApplicationArn } = await sns
      .createPlatformApplication({
        Name: inputs.name,
        Platform: inputs.platform,
        Attributes: inputs.attributes
      })
      .promise()
    platformApplicationArn = PlatformApplicationArn
    context.saveState(merge({ platformApplicationArn }, inputs))
  } else {
    context.log(`TBD no changes to ${inputs.name}`)
  }
  return context.setOutputs({
    arn: platformApplicationArn
  })
}

const remove = async (inputs, context) => {
  contextSetOutputs(context) // REMOVE
  const { state } = context
  context.log(`TBD removing ${state.platformApplicationArn}`)
  await sns
    .deletePlatformApplication({
      PlatformApplicationArn: state.platformApplicationArn
    })
    .promise()
  context.log(`TBD removed ${state.platformApplicationArn}`)
  context.saveState({})
  return context.setOutputs({})
}

module.exports = {
  deploy,
  remove
}
