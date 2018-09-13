/* eslint-disable no-console */
const aws = require('aws-sdk')
const ecs = new aws.ECS({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })

const deploy = async (inputs, context) => {
  const newState = await new Promise((resolve, reject) =>
    ecs.createService(inputs, (err, data) => {
      err ? reject(err) : resolve(data.service)
    })
  )
    .catch(context.log)
    .then((outputs) => outputs || {})

  context.saveState(newState || {})

  return newState
}

const remove = async (inputs, context) => {
  const { state } = context
  if (!state.hasOwnProperty('serviceName')) return {}

  const newState = await new Promise((resolve, reject) =>
    ecs.deleteService({ service: state.serviceName }, (err, data) => {
      err ? reject(err) : resolve(data.service)
    })
  )
    .catch(context.log)
    .then((outputs) => outputs || {})

  context.saveState(newState)

  return newState
}

const get = async (inputs, context) => {
  const { state } = context

  if (!state.hasOwnProperty('serviceName')) return {}

  const outputs = await new Promise((resolve, reject) =>
    ecs.describeServices({ services: [state.serviceName] }, (err, data) => {
      err ? reject(err) : resolve(Array.isArray(data.services) && data.services.shift())
    })
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
