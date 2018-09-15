const AWS = require('aws-sdk')
// const { equals, omit, isEmpty } = require('ramda')

const ec2 = new AWS.EC2({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1'
})

const deploy = async (inputs, context) => {
  context.log('Creating Internet Gateway Attachment')
  // const { state } = context
  // if (state.internetGatewayId) {
  //   return { internetGatewayId: state.internetGatewayId }
  // }

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
