const aws = require('aws-sdk')
const ecs = new aws.ECS({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })

const deploy = async (inputs, context) => {
  const { state } = context

  if (state.family && inputs.family !== state.family) {
    context.log('Change to ECS TaskDefinition "family" requires replacement. Making one now...')
    await remove({}, context)
  }

  const { taskDefinition } = await ecs.registerTaskDefinition(inputs).promise()
  context.log(`ECS TaskDefinition registered: "${inputs.family}"`)

  // Remove previous revision
  if (state.hasOwnProperty('family') && state.hasOwnProperty('revision')) {
    await remove({}, context)
  }

  context.saveState(taskDefinition || {})
  return taskDefinition
}

const remove = async (inputs, context) => {
  const { state } = context
  if (!state.hasOwnProperty('family') || !state.hasOwnProperty('revision')) return {}

  await ecs
    .deregisterTaskDefinition({ taskDefinition: `${state.family}:${state.revision}` })
    .promise()
  context.log(`ECS TaskDefinition revision deregistered: "${state.family}:${state.revision}"`)

  context.saveState({})
  return {}
}

const get = async (inputs, context) => {
  const { state } = context
  if (!state.hasOwnProperty('family') || !state.hasOwnProperty('revision')) return {}

  const { taskDefinition } = await ecs
    .describeTaskDefinition({ taskDefinition: `${state.family}:${state.revision}` })
    .promise()

  context.saveState(taskDefinition || {})
  return taskDefinition
}

module.exports = {
  deploy,
  get,
  remove
}
