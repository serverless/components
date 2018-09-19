const aws = require('aws-sdk')
const ecs = new aws.ECS({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })

const deploy = async (inputs, context) => {
  const { state } = context

  if (state.serviceName && inputs.serviceName !== state.serviceName) {
    context.log('Change to ECS service name requires replacement. Making one now...')
    await remove({}, context)
  }

  context.log(`Creating ECS service: "${inputs.serviceName}"`)
  const { service } = await ecs.createService(inputs).promise()

  context.log(`ECS service "${inputs.serviceName}" created`)

  context.saveState(service || {})

  return service
}

const remove = async (inputs, context) => {
  const { state } = context
  if (!state.hasOwnProperty('serviceName')) return {}

  const tasks = await ecs
    .listTasks({
      serviceName: state.serviceName
    })
    .promise()

  await Promise.all(
    (tasks.taskArns || []).map((task) => {
      context.log(`Stopping task: "${task}"`)
      return ecs
        .stopTask({
          task,
          cluster: state.clusterArn,
          reason: 'Removing service'
        })
        .promise()
    })
  )

  await ecs.deleteService({ service: state.serviceName }).promise()
  context.log(`ECS service "${state.serviceName}" removed`)

  context.saveState({})

  return {}
}

const get = async (inputs, context) => {
  const { state } = context
  if (!state.hasOwnProperty('serviceName')) return {}

  const { services } = await ecs.describeServices({ services: [state.serviceName] }).promise()

  const service = Array.isArray(services) ? services.shift() : {}

  context.saveState(service || {})

  return service
}

module.exports = {
  deploy,
  get,
  remove
}
