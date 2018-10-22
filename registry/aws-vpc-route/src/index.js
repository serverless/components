const AWS = require('aws-sdk')
const { equals, head, isEmpty, keys, merge, pick, reduce, slice } = require('ramda')

const ec2 = new AWS.EC2({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1'
})

const capitalize = (string) => `${head(string).toUpperCase()}${slice(1, Infinity, string)}`

const compareStateAndInputs = (state, inputs, objectKeys) => {
  const inputsPick = pick(objectKeys, inputs)
  const statePick = pick(objectKeys, state)
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
    context.log('Changes in the route requires replacement')
    await remove(inputs, context)
  }

  context.log(`Create a route for the route table "${inputs.routeTableId}"`)
  const params = reduce(
    (result, key) => merge(result, { [capitalize(key)]: inputs[key] }),
    {},
    keys(inputs)
  )
  await ec2.createRoute(params).promise()
  context.log(`The route for the route table "${inputs.routeTableId}" created`)
  context.saveState(inputs)
  return {}
}

const remove = async (inputs, context) => {
  const { state } = context
  context.log(`Removing the route from the route table "${state.routeTableId}"`)
  try {
    await ec2
      .deleteRoute({
        RouteTableId: state.routeTableId,
        DestinationCidrBlock: state.destinationCidrBlock,
        DestinationIpv6CidrBlock: state.DdstinationIpv6CidrBlock
      })
      .promise()
  } catch (error) {
    if (error.code !== 'InvalidRoute.NotFound') {
      throw error
    }
  }
  context.log(`The route removed from the route table "${state.routeTableId}"`)
  context.saveState({})
  return {}
}

module.exports = {
  deploy,
  remove
}
