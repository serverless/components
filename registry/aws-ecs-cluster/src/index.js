const AWS = require('aws-sdk')

const ecs = new AWS.ECS({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })

const deploy = async (inputs, context) => {
  const { state } = context

  if (inputs.clusterName === state.clusterName) {
    return {
      clusterArn: state.clusterArn
    }
  }

  if (state.clusterName && inputs.clusterName !== state.clusterName) {
    context.log('Change to ECS cluster name requires replacement')
    await remove({}, context)
  }

  context.log(`Creating ECS cluster: "${inputs.clusterName}"`)
  const { cluster } = await ecs
    .createCluster({
      clusterName: inputs.clusterName
    })
    .promise()

  context.log(`ECS cluster "${inputs.clusterName}" created`)

  context.saveState({
    clusterName: cluster.clusterName,
    clusterArn: cluster.clusterArn
  })

  return {
    clusterArn: cluster.clusterArn
  }
}

const remove = async (inputs, context) => {
  const { state } = context
  context.log(`Removing ECS cluster: "${state.clusterName}"`)

  await ecs
    // delete cluster doesn't throw error if it deleted manually
    .deleteCluster({
      cluster: state.clusterArn
    })
    .promise()

  context.log(`ECS cluster "${state.clusterName}" removed`)

  context.saveState({})

  return {}
}

module.exports = {
  deploy,
  remove
}
