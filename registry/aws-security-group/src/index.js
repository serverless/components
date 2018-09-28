const AWS = require('aws-sdk')
const { equals, isEmpty, merge, pick } = require('ramda')
const { sleep } = require('@serverless/utils')

const ec2 = new AWS.EC2({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })

const deploy = async (inputs, context) => {
  const { state } = context

  let groupName = inputs.groupName

  if (!groupName) {
    groupName = `default-${context.instanceId}`
  }

  const params = merge(inputs, { groupName })
  if (
    equals(
      pick(['vpcId', 'groupName', 'description'], state),
      pick(['vpcId', 'groupName', 'description'], params)
    )
  ) {
    return { groupId: state.groupId, groupName: state.groupName }
  }

  if (
    !isEmpty(state) &&
    (state.vpcId !== inputs.vpcId ||
      state.groupName !== inputs.groupName ||
      state.description !== inputs.description)
  ) {
    deleteSecurityGroupWithRetry(state.groupId, 20)
  }

  context.log(`Creating security group "${params.groupName}"`)
  const { GroupId: groupId } = await ec2
    .createSecurityGroup({
      Description: inputs.description,
      GroupName: groupName,
      VpcId: inputs.vpcId
    })
    .promise()
  context.log(`Security group "${params.groupName}" created with id "${groupId}"`)
  context.saveState({
    groupId,
    ...params
  })

  return { groupId, groupName: params.groupName }
}

const deleteSecurityGroupWithRetry = async (groupId, retryCount) =>
  new Promise(async (resolve, reject) => {
    let counter = 0
    while (counter <= retryCount) {
      try {
        await deleteSecurityGroup(groupId)
        return resolve()
      } catch (exception) {
        if (exception.code === 'InvalidGroup.NotFound') {
          return resolve()
        }
        if (counter === retryCount) {
          return reject(exception)
        }
      }
      await sleep(3000)
      counter++
    }
  })

const deleteSecurityGroup = async (GroupId) =>
  ec2
    .deleteSecurityGroup({
      GroupId
    })
    .promise()

const remove = async (inputs, context) => {
  const { state } = context
  context.log(`Removing security group "${state.groupName}"`)
  // errors are handler in the deleteSecurityGroupWithRetry
  await deleteSecurityGroupWithRetry(state.groupId, 20)
  context.log(`Security group "${state.groupName}" removed`)
  context.saveState({})
  return {}
}

module.exports = {
  deploy,
  remove
}
