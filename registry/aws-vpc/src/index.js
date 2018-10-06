const AWS = require('aws-sdk')
const { equals, filter, head, isEmpty, merge, pick } = require('ramda')
const { sleep } = require('@serverless/utils')

const ec2 = new AWS.EC2({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1'
})

const compareStateAndInputs = (state, inputs, keys) => {
  const inputsPick = pick(keys, inputs)
  const statePick = pick(keys, state)
  return equals(statePick, inputsPick)
}

const deploy = async (inputs, context) => {
  const { state } = context
  let newState = {}
  if (
    !compareStateAndInputs(state, inputs, [
      'cidrBlock',
      'amazonProvidedIpv6CidrBlock',
      'instanceTenancy'
    ])
  ) {
    context.log(`Creating a VPC`)
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

    const { SecurityGroups } = await ec2
      .describeSecurityGroups({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [Vpc.VpcId]
          }
        ]
      })
      .promise()

    const defaultSecurityGroupId =
      SecurityGroups.length > 0 ? head(SecurityGroups).GroupId : undefined

    newState = merge(newState, {
      defaultSecurityGroupId,
      vpcId: Vpc.VpcId,
      cidrBlock: Vpc.CidrBlock,
      instanceTenancy: Vpc.InstanceTenancy,
      amazonProvidedIpv6CidrBlock: inputs.amazonProvidedIpv6CidrBlock
    })
    context.log(`VPC created: "${newState.vpcId}"`)
  } else {
    newState = merge(newState, {
      defaultSecurityGroupId: state.defaultSecurityGroupId,
      vpcId: state.vpcId,
      cidrBlock: state.cidrBlock,
      instanceTenancy: state.instanceTenancy,
      amazonProvidedIpv6CidrBlock: state.amazonProvidedIpv6CidrBlock
    })
  }

  context.saveState(newState)

  return {
    vpcId: newState.vpcId
  }
}

const describeSubnets = async (vpcId, context) => {
  let ready
  try {
    const { Subnets: subnets } = await ec2
      .describeSubnets({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      })
      .promise()
    ready = subnets.length === 0
    if (!ready) {
      context.log(`Waiting for ${subnets.map(({ SubnetId }) => SubnetId).join(', ')} to be removed`)
    }
  } catch (exception) {
    context.log('ERROR: describeSubnets', vpcId, exception.message)
    ready = true
  }
  return ready
}

const describeInternetGateways = async (vpcId, context) => {
  let ready
  try {
    const { InternetGateways: internetGateways } = await ec2
      .describeInternetGateways({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId]
          }
        ]
      })
      .promise()
    ready = internetGateways.length === 0
    if (!ready) {
      context.log(
        `Waiting for ${internetGateways
          .map(({ InternetGatewayId }) => InternetGatewayId)
          .join(', ')} to be removed`
      )
    }
  } catch (exception) {
    context.log('ERROR: describeInternetGateways', vpcId, exception.message)
    ready = true
  }
  return ready
}

const describeSecurityGroups = async (vpcId, context) => {
  let ready
  try {
    const { SecurityGroups: securityGroups } = await ec2
      .describeSecurityGroups({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      })
      .promise()
    // VPC removal will delete the default security group automatically
    const filteredSecurityGroups = filter(
      ({ GroupId }) => GroupId !== context.state.defaultSecurityGroupId,
      securityGroups
    )
    ready = filteredSecurityGroups.length === 0
    if (!ready) {
      context.log(
        `Waiting for ${securityGroups.map(({ GroupId }) => GroupId).join(', ')} to be removed`
      )
    }
  } catch (exception) {
    context.log('ERROR: describeSecurityGroups', vpcId, exception.message)
    ready = true
  }
  return ready
}

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
    waitFor(() => describeInternetGateways(vpcId, context)),
    waitFor(() => describeSecurityGroups(vpcId, context))
  ])

const remove = async (inputs, context) => {
  const { state } = context
  context.log(`Removing VPC: "${state.vpcId}"`)
  context.log('Waiting for VPC dependencies to be removed')
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
