const AWS = require('aws-sdk')
const { equals, isEmpty, omit } = require('ramda')

const ec2 = new AWS.EC2({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1'
})

const compareStateAndInputs = (state, inputs) => {
  return equals(omit(['vpcId'], state), inputs)
}

const deploy = async (inputs, context) => {
  const { state } = context
  if (compareStateAndInputs(state, inputs)) {
    return { vpcId: state.vpcId }
  }
  // any changes to vpc requires replacement
  if (!isEmpty(state) && !compareStateAndInputs(state, inputs)) {
    context.log(`Changes to existing VPC requires replacement`)
    remove(state, context) // because of the dependecies, vpc must be removed asynchronously
  }
  context.log(`Creating a VPC`)
  const { Vpc } = await ec2
    .createVpc({
      CidrBlock: inputs.cidrBlock,
      InstanceTenancy: inputs.instanceTenancy,
      AmazonProvidedIpv6CidrBlock: inputs.amazonProvidedIpv6CidrBlock
    })
    .promise()

  context.saveState({
    vpcId: Vpc.VpcId,
    amazonProvidedIpv6CidrBlock: inputs.amazonProvidedIpv6CidrBlock,
    cidrBlock: Vpc.CidrBlock,
    instanceTenancy: Vpc.InstanceTenancy
  })

  context.log(`VPC created: "${Vpc.VpcId}"`)

  return {
    vpcId: Vpc.VpcId
  }
}

const describeSubnets = (vpcId, context) =>
  ec2
    .describeSubnets()
    .promise()
    .then(({ Subnets }) => Subnets.filter(({ VpcId }) => VpcId === vpcId))
    .then((subnets) => {
      const ready = subnets.length === 0
      if (!ready) {
        context.log(
          `Waiting for ${subnets.map(({ SubnetId }) => SubnetId).join(', ')} to be removed`
        )
      }
      return ready
    })

const sleep = (time) => new Promise((resolve) => setTimeout(() => resolve(), time))

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
  Promise.all([waitFor(() => describeSubnets(vpcId, context))])

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
