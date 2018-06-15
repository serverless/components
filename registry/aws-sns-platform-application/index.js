/* eslint-disable no-console */

const AWS = require('aws-sdk')

const sns = new AWS.SNS({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })

const { merge, equals } = require('ramda')

const contextSetOutputs = (context) => {
  context.setOutputs = (output) => {
    console.warn('*** temp setout', output)
    return output // dummy output remove after PR #223
  }
}

const deploy = async (inputs, context) => {
  contextSetOutputs(context) // REMOVE
  const { state } = context
  if (
    state.platformApplicationArn &&
    (inputs.name !== state.name ||
      inputs.platform !== state.platform ||
      !equals(inputs.attributes, state.attributes))
  ) {
    context.log(`TBD to update ${inputs.name} old one needs to be removed first`)
    await remove(inputs, context)
  }
  context.log(`TBD creating ${inputs.name}`)
  const { PlatformApplicationArn } = await sns
    .createPlatformApplication({
      Name: inputs.name,
      Platform: inputs.platform,
      Attributes: inputs.attributes
    })
    .promise()
  context.saveState(merge({ platformApplicationArn: PlatformApplicationArn }, inputs))
  return context.setOutputs({
    arn: PlatformApplicationArn
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
