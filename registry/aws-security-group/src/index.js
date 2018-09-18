const AWS = require('aws-sdk')

const ec2 = new AWS.EC2({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })

const deploy = async (inputs, context) => {
  // const { state } = context
  const { GroupId: groupId } = await ec2
    .createSecurityGroup({
      Description: inputs.description,
      GroupName: inputs.groupName,
      VpcId: inputs.vpcId
    })
    .promise()

  context.saveState({
    groupId,
    ...inputs
  })

  return { groupId }
}

const remove = async (inputs, context) => {
  const { state } = context
  await ec2
    .deleteSecurityGroup({
      GroupId: state.groupId
    })
    .promise()
  context.saveState({})
  return {}
}

module.exports = {
  deploy,
  remove
}

// const AWS = require('aws-sdk')

// const ecs = new AWS.ECS({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })

// const deploy = async (inputs, context) => {
//   const { state } = context

//   if (inputs.clusterName === state.clusterName) {
//     return {
//       clusterArn: state.clusterArn
//     }
//   }

//   if (state.clusterName && inputs.clusterName !== state.clusterName) {
//     context.log('Change to ECS cluster name requires replacement')
//     await remove({}, context)
//   }

//   context.log(`Creating ECS cluster: "${inputs.clusterName}"`)
//   const { cluster } = await ecs
//     .createCluster({
//       clusterName: inputs.clusterName
//     })
//     .promise()

//   context.log(`ECS cluster "${inputs.clusterName}" created`)

//   context.saveState({
//     clusterName: cluster.clusterName,
//     clusterArn: cluster.clusterArn
//   })

//   return {
//     clusterArn: cluster.clusterArn
//   }
// }

// const remove = async (inputs, context) => {
//   const { state } = context
//   context.log(`Removing ECS cluster: "${state.clusterName}"`)

//   const tasks = await ecs
//     .listTasks({
//       cluster: state.clusterArn
//     })
//     .promise()

//   await Promise.all(
//     (tasks.taskArns || []).map((task) => {
//       context.log(`Stopping task: "${task}"`)
//       return ecs
//         .stopTask({
//           task,
//           cluster: state.clusterArn,
//           reason: 'Removing cluster'
//         })
//         .promise()
//     })
//   )

//   await ecs
//     // delete cluster doesn't throw error even if it is deleted manually
//     .deleteCluster({
//       cluster: state.clusterArn
//     })
//     .promise()

//   context.log(`ECS cluster "${state.clusterName}" removed`)

//   context.saveState({})

//   return {}
// }

// module.exports = {
//   deploy,
//   remove
// }
