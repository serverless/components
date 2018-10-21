const AWS = require('aws-sdk')
const { isEmpty } = require('ramda')

const ec2 = new AWS.EC2({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1'
})

const deploy = async (inputs, context) => {
  const { state } = context
  if (!isEmpty(state) && inputs.vpcId === state.vpcId) {
    return { routeTableId: state.routeTableId }
  }

  if (!isEmpty(state) && inputs.vpcId !== state.vpcId) {
    context.log(`Updating the VPC Route Table "${state.routeTableId}"`)
    await remove(inputs, context)
  } else {
    context.log('Creating a VPC Route Table')
  }

  const { RouteTable: routeTable } = await ec2
    .createRouteTable({
      VpcId: inputs.vpcId
    })
    .promise()

  context.saveState({
    vpcId: inputs.vpcId,
    routeTableId: routeTable.RouteTableId
  })
  context.log(`Route table "${routeTable.RouteTableId}" created`)
  return { routeTableId: routeTable.RouteTableId }
}

const remove = async (inputs, context) => {
  const { state } = context
  context.log(`Removing the route table "${state.routeTableId}"`)
  await ec2
    .deleteRouteTable({
      RouteTableId: state.routeTableId
    })
    .promise()
  context.log(`Route table "${state.routeTableId}" removed`)
  context.saveState({})
  return {}
}

module.exports = {
  deploy,
  remove
}
