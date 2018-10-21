const AWS = require('aws-sdk')
const { isEmpty, pick, equals } = require('ramda')

const ec2 = new AWS.EC2({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1'
})

// const capitalize = (string) => `${head(string).toUpperCase()}${slice(1, Infinity, string)}`

const compareStateAndInputs = (state, inputs, keys) => {
  const inputsPick = pick(keys, inputs)
  const statePick = pick(keys, state)
  return equals(statePick, inputsPick)
}

const deploy = async (inputs, context) => {
  const { state } = context
  if (!isEmpty(state) && equals(state, inputs)) {
    return {}
  }

  if (
    !isEmpty(state) &&
    !compareStateAndInputs(state, inputs, [
      'routeTableId',
      'destinationIpv6CidrBlock',
      'destinationCidrBlock'
    ])
  ) {
    context.log('changes in the route requires replacement')
    await remove(inputs, context)
  }

  context.log(`create a route for the route table "${inputs.routeTableId}"`)
  await ec2
    .createRoute({
      DestinationCidrBlock: inputs.destinationCidrBlock,
      GatewayId: inputs.gatewayId,
      RouteTableId: inputs.routeTableId
    })
    .promise()
  context.log(`the route for the route table "${inputs.routeTableId}" created`)
  context.saveState(inputs)
  return {}
}

const remove = async (inputs, context) => {
  const { state } = context
  context.log(`removing the route from the route table "${state.routeTableId}"`)
  try {
    await ec2
      .deleteRoute({
        RouteTableId: state.routeTableId,
        DestinationCidrBlock: state.destinationCidrBlock,
        DestinationIpv6CidrBlock: state.DdstinationIpv6CidrBlock
      })
      .promise()
  } catch (error) {
    // console.log(error)
    throw error
  }
  context.log(`the route removed from the route table "${state.routeTableId}"`)
  context.saveState({})
  return {}
}

module.exports = {
  deploy,
  remove
}
