const AWS = require('aws-sdk')
const { isEmpty } = require('ramda')

const ec2 = new AWS.EC2({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1'
})

const deploy = async (inputs, context) => {
  context.log('Creating Internet Gateway')
  const { state } = context
  if (state.internetGatewayId) {
    return { internetGatewayId: state.internetGatewayId }
  }

  const { InternetGateway } = await ec2.createInternetGateway().promise()
  let awsVpcgatewayattachment = {}
  if (inputs.vpcId) {
    const awsVpcgatewayattachmentComponent = await context.load(
      'aws-vpcgatewayattachment',
      'vpcgatewayattachment',
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

  context.log(`Internet Gateway created: "${InternetGateway.InternetGatewayId}"`)

  return {
    internetGatewayId: InternetGateway.InternetGatewayId
  }
}

const remove = async (inputs, context) => {
  const { state } = context

  if (!isEmpty(state.awsVpcgatewayattachment)) {
    const awsVpcgatewayattachmentComponent = await context.load(
      'aws-vpcgatewayattachment',
      'vpcgatewayattachment',
      {
        vpcId: state.vpcId,
        internetGatewayId: state.internetGatewayId
      }
    )
    await awsVpcgatewayattachmentComponent.remove()
  }

  context.log(`Removing Internet Gateway: "${state.internetGatewayId}"`)
  await ec2.deleteInternetGateway({ InternetGatewayId: state.internetGatewayId }).promise()
  context.saveState({})
  context.log(`Internet Gateway "${state.internetGatewayId}" removed`)
  return {}
}

module.exports = {
  deploy,
  remove
}
