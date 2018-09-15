const AWS = require('aws-sdk')
const { isEmpty } = require('ramda')

const ec2 = new AWS.EC2({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1'
})

const deploy = async (inputs, context) => {
  const { state } = context
  if (state.internetGatewayId) {
    return { internetGatewayId: state.internetGatewayId }
  }

  context.log('Creating Internet Gateway')
  const { InternetGateway } = await ec2.createInternetGateway().promise()
  context.log(`Internet Gateway created: "${InternetGateway.InternetGatewayId}"`)
  let awsVpcgatewayattachment = {}
  if (inputs.vpcId) {
    const awsVpcgatewayattachmentComponent = await context.load(
      'aws-vpcgatewayattachment',
      'defaultAWSVpcgatewayattachment',
      {
        vpcId: inputs.vpcId,
        internetGatewayId: InternetGateway.InternetGatewayId
      }
    )
    awsVpcgatewayattachment = await awsVpcgatewayattachmentComponent.deploy()
  }

  context.saveState({
    internetGatewayId: InternetGateway.InternetGatewayId,
    vpcId: inputs.vpcId,
    awsVpcgatewayattachment
  })

  return {
    internetGatewayId: InternetGateway.InternetGatewayId
  }
}

const remove = async (inputs, context) => {
  const { state } = context
  if (!isEmpty(state.awsVpcgatewayattachment)) {
    const awsVpcgatewayattachmentComponent = await context.load(
      'aws-vpcgatewayattachment',
      'defaultAWSVpcgatewayattachment',
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
