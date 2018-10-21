const AWS = require('aws-sdk')
const { isEmpty } = require('ramda')

const ec2 = new AWS.EC2({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1'
})

const deploy = async (inputs, context) => {
  const { state } = context
  if (
    !isEmpty(state) &&
    inputs.subnetId === state.subnetId &&
    inputs.routeTableId === state.routeTableId
  ) {
    return { associationId: state.associationId }
  }

  // @todo remove after type-system branch merge
  if (!isEmpty(state) && inputs.subnetId !== state.subnetId) {
    context.log(`Updating the VPC Route Table Association "${state.associationId}"`)
    await remove(inputs, context)
  } else {
    context.log('Creating a VPC Route Table Association')
  }

  const { AssociationId: associationId } = await ec2
    .associateRouteTable({
      SubnetId: inputs.subnetId,
      RouteTableId: inputs.routeTableId
    })
    .promise()

  context.saveState({
    associationId,
    subnetId: inputs.subnetId,
    routeTableId: inputs.routeTableId
  })

  return { associationId }
}

const remove = async (inputs, context) => {
  const { state } = context
  context.log(`Removing the route table association "${state.associationId}"`)
  await ec2
    .disassociateRouteTable({
      AssociationId: state.associationId
    })
    .promise()
  context.log(`Route table "${state.associationId}" removed`)
  context.saveState({})
  return {}
}

const replacement = (inputs, context) => {
  const { state } = context
  return !isEmpty(state) && inputs.vpcId !== state.vpcId
}

module.exports = {
  deploy,
  remove,
  replacement
}
