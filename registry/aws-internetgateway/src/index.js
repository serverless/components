const AWS = require('aws-sdk')
// const { equals, omit, isEmpty } = require('ramda')

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
  context.saveState({
    internetGatewayId: InternetGateway.InternetGatewayId
  })

  context.log(`Internet Gateway created: "${InternetGateway.InternetGatewayId}"`)

  return {
    internetGatewayId: InternetGateway.InternetGatewayId
  }
}

const remove = async (inputs, context) => {
  const { state } = context
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
