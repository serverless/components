const AWS = require('aws-sdk')
const { equals, isEmpty, pick } = require('ramda')

const ec2 = new AWS.EC2({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1'
})

const compareStateAndInputs = (state, inputs, keys) => {
  const inputsPick = pick(keys, inputs)
  const statePick = pick(keys, state)
  return equals(statePick, inputsPick)
}

const deploy = async (inputs, context) => {
  const { state } = context
  if (compareStateAndInputs(state, inputs, ['internetGatewayId', 'vpcId'])) {
    return { internetGatewayId: state.internetGatewayId }
  }

  // when vpcId or internetGatewayId changes gateway attachment need to be replaced
  if (!isEmpty(state) && !compareStateAndInputs(state, inputs, ['internetGatewayId', 'vpcId'])) {
    await remove(inputs, context)
  }

  context.log('Creating Internet Gateway Attachment')
  await ec2
    .attachInternetGateway({
      InternetGatewayId: inputs.internetGatewayId,
      VpcId: inputs.vpcId
    })
    .promise()

  context.saveState({
    internetGatewayId: inputs.internetGatewayId,
    vpcId: inputs.vpcId
  })

  context.log('Internet Gateway Attachment created')

  return {
    internetGatewayId: inputs.internetGatewayId
  }
}

const remove = async (inputs, context) => {
  const { state } = context
  context.log('Removing Internet Gateway Attachment')
  if (state.vpcId && state.internetGatewayId) {
    try {
      await ec2
        .detachInternetGateway({
          VpcId: state.vpcId,
          InternetGatewayId: state.internetGatewayId
        })
        .promise()
    } catch (exception) {
      if (
        exception.message !== `The internetGateway ID '${state.internetGatewayId}' does not exist`
      ) {
        throw exception
      }
    }
  }
  context.saveState({})
  context.log(`Internet Gateway Attachment removed`)
  return {}
}

module.exports = {
  deploy,
  remove
}
