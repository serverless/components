const AWS = require('aws-sdk')

const ec2 = new AWS.EC2({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })

const deploy = async (inputs, context) => {
  const { state } = context

  let groupName = inputs.groupName
  if (!groupName) {
    groupName = `default-${inputs.vpcId}`
  }

  // temp
  if (state.groupName === groupName) {
    return { groupId: state.groupId }
  }

  context.log(`Creating security group "${groupName}"`)
  const { GroupId: groupId } = await ec2
    .createSecurityGroup({
      Description: inputs.description,
      GroupName: groupName,
      VpcId: inputs.vpcId
    })
    .promise()
  context.log(`Security group "${groupName}" created with id "${groupId}"`)
  context.saveState({
    groupId,
    ...inputs,
    groupName
  })

  return { groupId }
}

const remove = async (inputs, context) => {
  const { state } = context
  context.log(`Removing security group "${state.groupName}"`)
  try {
    await ec2
      .deleteSecurityGroup({
        GroupId: state.groupId
      })
      .promise()
  } catch (exception) {
    if (exception.code !== 'InvalidGroup.NotFound') {
      throw exception
    }
  }
  context.log(`Security group "${state.groupName}" removed`)
  context.saveState({})
  return {}
}

module.exports = {
  deploy,
  remove
}
