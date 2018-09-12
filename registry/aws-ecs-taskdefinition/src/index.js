/* eslint-disable no-console */
const aws = require('aws-sdk')
const ecs = new aws.ECS({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })

const deploy = async (inputs, context) => {
  const newState = await new Promise((resolve, reject) =>
    ecs.registerTaskDefinition(inputs, (err, data) => {
      err ? reject(err) : resolve(data.taskDefinition)
    })
  )
    .catch(context.log)
    .then((outputs) => outputs || {})

  context.saveState(newState || {})

  return newState
}

const remove = async (inputs, context) => {
  const { state } = context
  if (!state.hasOwnProperty('family') || !state.hasOwnProperty('revision')) return {}

  const newState = await new Promise((resolve, reject) =>
    ecs.deregisterTaskDefinition(
      { taskDefinition: `${state.family}:${state.revision}` },
      (err, data) => {
        err ? reject(err) : resolve(data.taskDefinition)
      }
    )
  )
    .catch(context.log)
    .then((outputs) => outputs || {})

  context.saveState(newState)

  return newState
}

const get = async (inputs, context) => {
  const { state } = context

  if (!state.hasOwnProperty('family') || !state.hasOwnProperty('revision')) return {}

  const outputs = await new Promise((resolve, reject) =>
    ecs.describeTaskDefinition(
      { taskDefinition: `${state.family}:${state.revision}` },
      (err, data) => {
        err ? reject(err) : resolve(data.taskDefinition)
      }
    )
  )
    .catch(context.log)
    .then((res) => res || {})

  return outputs
}

module.exports = {
  deploy,
  get,
  remove
}
