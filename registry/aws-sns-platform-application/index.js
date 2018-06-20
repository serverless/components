/* eslint-disable no-console */

const AWS = require('aws-sdk')

const sns = new AWS.SNS({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })

const { merge, equals, filter } = require('ramda')

const mapParams = (object) => {
  return filter((item) => typeof item !== 'undefined')({
    name: object.name,
    platform: object.platform,
    attributes: object.attributes
  })
}

const deploy = async (inputs, context) => {
  const { state } = context
  let platformApplicationArn = state.platformApplicationArn
  if (platformApplicationArn && !equals(mapParams(inputs), mapParams(state))) {
    context.log(
      `To update the SNS Platform Application'${inputs.name}', old version needs to be removed`
    )
    await remove(inputs, context)
  }
  if (!equals(mapParams(inputs), mapParams(state))) {
    context.log(`Creating a SNS Platform Application '${inputs.name}'`)
    const { PlatformApplicationArn } = await sns
      .createPlatformApplication({
        Name: inputs.name,
        Platform: inputs.platform,
        Attributes: inputs.attributes
      })
      .promise()
    context.log(`SNS Platform application '${inputs.name}' created`)
    platformApplicationArn = PlatformApplicationArn
    context.saveState(merge({ platformApplicationArn }, inputs))
  } else {
    context.log(`No changes to the SNS Platform Application '${inputs.name}'`)
  }
  context.setOutputs({
    arn: platformApplicationArn
  })
  return {
    arn: platformApplicationArn
  }
}

const remove = async (inputs, context) => {
  const { state } = context
  context.log(`Removing the SNS Platform Application '${state.name}'`)
  await sns
    .deletePlatformApplication({
      PlatformApplicationArn: state.platformApplicationArn
    })
    .promise()
  context.log(`SNS Platform Application '${state.name}' removed`)
  context.saveState({})
  context.setOutputs({})
  return {}
}

module.exports = {
  deploy,
  remove
}
