const AWS = require('aws-sdk')
const { equals, isEmpty, merge, pick } = require('ramda')

const sleep = require('./sleep')

const ec2 = new AWS.EC2({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1'
})

const compareStateAndInputs = (state, inputs, keys = []) => {
  const inputsPick = pick(keys, inputs)
  const statePick = pick(keys, state)
  return equals(statePick, inputsPick)
}

const deploy = async (inputs, context) => {
  const { state } = context
  let newState = {}
  context.log(`Creating a VPC`)
  if (
    !compareStateAndInputs(state, inputs, [
      'cidrBlock',
      'amazonProvidedIpv6CidrBlock',
      'instanceTenancy'
    ])
  ) {
    if (!isEmpty(state)) {
      context.log(`Changes to existing VPC requires replacement`)
      remove(state, context) // because of the dependencies, VPC must be removed asynchronously
    }
    const { Vpc } = await ec2
      .createVpc({
        CidrBlock: inputs.cidrBlock,
        InstanceTenancy: inputs.instanceTenancy,
        AmazonProvidedIpv6CidrBlock: inputs.amazonProvidedIpv6CidrBlock
      })
      .promise()
    newState = merge(newState, {
      vpcId: Vpc.VpcId,
      cidrBlock: Vpc.CidrBlock,
      instanceTenancy: Vpc.InstanceTenancy,
      amazonProvidedIpv6CidrBlock: inputs.amazonProvidedIpv6CidrBlock
    })
    context.log(`VPC created: "${newState.vpcId}"`)
  } else {
    newState = merge(newState, { vpcId: state.vpcId })
    newState = merge(newState, {
      vpcId: state.vpcId,
      cidrBlock: state.cidrBlock,
      instanceTenancy: state.instanceTenancy,
      amazonProvidedIpv6CidrBlock: state.amazonProvidedIpv6CidrBlock
    })
  }

  let internetgatewayComponent
  if (inputs.internetGateway === true) {
    internetgatewayComponent = await context.load(
      'aws-internetgateway',
      `defaultAWSInternetgateway${newState.vpcId}`,
      {
        vpcId: newState.vpcId
      }
    )
    const { internetGatewayId } = await internetgatewayComponent.deploy()
    newState = merge(newState, { internetGatewayId })
  } else if (inputs.internetGateway !== true && state.internetGatewayId) {
    internetgatewayComponent = await context.load(
      'aws-internetgateway',
      `defaultAWSInternetgateway${state.vpcId}`,
      {
        vpcId: state.vpcId,
        internetGatewayId: state.internetGatewayId
      }
    )
    await internetgatewayComponent.remove()
  }

  context.saveState(newState)

  return {
    vpcId: newState.vpcId
  }
}

const describeSubnets = (vpcId, context) =>
  ec2
    .describeSubnets({
      Filters: [
        {
          Name: 'vpc-id',
          Values: [vpcId]
        }
      ]
    })
    .promise()
    .then(({ Subnets: subnets }) => {
      const ready = subnets.length === 0
      if (!ready) {
        context.log(
          `Waiting for ${subnets.map(({ SubnetId }) => SubnetId).join(', ')} to be removed`
        )
      }
      return ready
    })
    .catch((error) => {
      context.log('ERROR: describeSubnets', vpcId, error.message)
      return true
    })

const describeInternetGateways = (vpcId, context) =>
  ec2
    .describeInternetGateways({
      Filters: [
        {
          Name: 'attachment.vpc-id',
          Values: [vpcId]
        }
      ]
    })
    .promise()
    .then(({ InternetGateways: internetGateways }) => {
      const ready = internetGateways.length === 0
      if (!ready) {
        context.log(
          `Waiting for ${internetGateways
            .map(({ InternetGatewayId }) => InternetGatewayId)
            .join(', ')} to be removed`
        )
      }
      return ready
    })
    .catch((error) => {
      context.log('ERROR: describeInternetGateways', vpcId, error.message)
      return true
    })

const waitFor = async (service) =>
  new Promise(async (resolve) => {
    let ready = false
    while (!ready) {
      ready = await service()
      if (ready) {
        return resolve()
      }
      await sleep(2000)
    }
  })

const waitForDependenciesToBeRemoved = async (vpcId, context) =>
  // check for following component states
  // Subnets
  // Security Groups
  // Network ACLs
  // VPN Attachments
  // Internet Gateways
  // Route Tables
  // Network Interfaces
  // VPC Peering Connections
  Promise.all([
    waitFor(() => describeSubnets(vpcId, context)),
    waitFor(() => describeInternetGateways(vpcId, context))
  ])

const remove = async (inputs, context) => {
  const { state } = context
  context.log(`Removing VPC: "${state.vpcId}"`)
  context.log('Waiting for VPC dependencies to be removed')
  if (state.internetGatewayId) {
    const internetgatewayComponent = await context.load(
      'aws-internetgateway',
      `defaultAWSInternetgateway${state.vpcId}`,
      {
        vpcId: state.vpcId,
        internetGatewayId: state.internetGatewayId
      }
    )

    await internetgatewayComponent.remove()
  }
  await waitForDependenciesToBeRemoved(state.vpcId, context)
  try {
    await ec2
      .deleteVpc({
        VpcId: state.vpcId
      })
      .promise()
  } catch (exception) {
    if (exception.message !== `The vpc ID '${state.vpcId}' does not exist`) {
      throw exception
    }
  }
  context.log(`VPC "${state.vpcId}" removed`)
  context.saveState({})
  return {}
}

module.exports = {
  deploy,
  remove
}
