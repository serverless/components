const AWS = require('aws-sdk')
const { isEmpty } = require('ramda')

const ec2 = new AWS.EC2({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1'
})

const deploy = async (inputs, context) => {
  const { state } = context
  if (state.internetGatewayId && inputs.vpcId === state.vpcId) {
    return { internetGatewayId: state.internetGatewayId }
  }

  let internetGatewayId = state.internetGatewayId

  if (!state.internetGatewayId) {
    context.log('Creating Internet Gateway')
    const { InternetGateway } = await ec2.createInternetGateway().promise()
    internetGatewayId = InternetGateway.InternetGatewayId
    context.log(`Internet Gateway created: "${InternetGateway.InternetGatewayId}"`)
  }

  let awsVpcgatewayattachment = {}
  if (inputs.vpcId && (!state.vpcId || state.vpcId !== inputs.vpcId)) {
    // create gateway attachment if vpcId is defined
    const attachmentDeloyComponent = await context.load(
      'aws-vpcgatewayattachment',
      `defaultAWSVpcgatewayattachment${internetGatewayId}`,
      {
        vpcId: inputs.vpcId,
        internetGatewayId
      }
    )
    awsVpcgatewayattachment = await attachmentDeloyComponent.deploy()
  }

  if ((state.vpcId && !inputs.vpcId) || (state.vpcId && state.vpcId !== inputs.vpcId)) {
    const attachmentRemoveComponent = await context.load(
      'aws-vpcgatewayattachment',
      `defaultAWSVpcgatewayattachment${state.internetGatewayId}`,
      {
        vpcId: state.vpcId,
        internetGatewayId: state.internetGatewayId
      }
    )
    await attachmentRemoveComponent.remove()
  }

  context.saveState({
    internetGatewayId,
    vpcId: inputs.vpcId,
    awsVpcgatewayattachment
  })

  return {
    internetGatewayId
  }
}

const remove = async (inputs, context) => {
  const { state } = context
  if (!isEmpty(state.awsVpcgatewayattachment || {})) {
    const awsVpcgatewayattachmentComponent = await context.load(
      'aws-vpcgatewayattachment',
      `defaultAWSVpcgatewayattachment${state.internetGatewayId}`,
      {
        vpcId: state.vpcId,
        internetGatewayId: state.internetGatewayId
      }
    )
    await awsVpcgatewayattachmentComponent.remove()
  }
  if (state.internetGatewayId) {
    try {
      context.log(`Removing Internet Gateway: "${state.internetGatewayId}"`)
      await ec2.deleteInternetGateway({ InternetGatewayId: state.internetGatewayId }).promise()
    } catch (exception) {
      if (
        exception.message !== `The internetGateway ID '${state.internetGatewayId}' does not exist`
      ) {
        throw exception
      }
    }
    context.log(`Internet Gateway "${state.internetGatewayId}" removed`)
  }
  context.saveState({})
  return {}
}

module.exports = {
  deploy,
  remove
}
