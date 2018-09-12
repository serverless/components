const AWS = require('aws-sdk')
const { equals, isEmpty } = require('ramda')

const ec2 = new AWS.EC2({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1'
})

const compareStateAndInputs = (state, inputs) => {
  const { cidrBlock, instanceTenancy, amazonProvidedIpv6CidrBlock } = state
  return equals({ cidrBlock, instanceTenancy, amazonProvidedIpv6CidrBlock }, inputs)
}

const deploy = async (inputs, context) => {
  const { state } = context
  if (compareStateAndInputs(state, inputs)) {
    return { vpcId: state.vpcId }
  }
  // any changes to vpc requires replacement
  if (!isEmpty(state) && !compareStateAndInputs(state, inputs)) {
    context.log(`Changes to existing VPC requires replacement`)
    await remove(state, context)
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
const remove = async (inputs, context) => {
  const { state } = context
  context.log(`Removing VPC: "${state.vpcId}"`)
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
  context.log(`VPC removed`)
  context.saveState({})
  return {}
}
module.exports = {
  deploy,
  remove
}
