const AWS = require('aws-sdk')
const SQS = new AWS.SQS({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })
const { keys, equals } = require('ramda')

const createQueue = async (queueName, attributes) => {
  const params = {
    QueueName: queueName,
    Attributes: attributes
  }

  return SQS.createQueue(params)
    .promise()
    .then((res) => res.QueueUrl)
}

const deleteQueue = async (state) => {
  try {
    await SQS.deleteQueue(state.queueUrl).promise()
  } catch (error) {
    if (!error.message.includes('The specified queue does not exist')) {
      throw new Error(error)
    }
  }
  return null
}

const capitalizeKeys = (obj) => {
  keys(obj).map((key) => {
    obj[capitalizeString(key)] = obj[key]
    delete obj[key]
  })
  return obj
}

const capitalizeString = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const deploy = async (inputs, context) => {
  let { state } = context

  const queueName = inputs.queueName
  delete inputs.queueName
  const attributes = capitalizeKeys(inputs)

  if (!state.queueName && queueName) {
    context.log(`Creating Queue: ${queueName}`)
    const queueUrl = await createQueue(queueName, attributes)
    state = {
      ...state,
      queueUrl,
      queueName,
      attributes
    }
  } else if (!queueName && state.queueName) {
    context.log(`Removing Queue: ${state.queueName}`)
    await deleteQueue(state)
    state = {
      ...state,
      queueUrl: null,
      queueName: null,
      attributes: null
    }
  } else if (!equals(state.queueName, queueName) || !equals(state.attributes, attributes)) {
    context.log(`Removing Queue: ${state.queueName}`)
    await deleteQueue(state)
    context.log(`Creating Queue: ${queueName}`)
    const queueUrl = await createQueue(queueName, attributes)
    state = {
      ...state,
      queueUrl,
      queueName,
      attributes
    }
  }

  context.saveState(state)
  return state.queueUrl
}

const remove = async (inputs, context) => {
  let { state } = context
  context.log(`Removing Queue: ${state.queueName}`)
  await deleteQueue(state)
  state = {
    ...state,
    queueUrl: null,
    queueName: null,
    attributes: null
  }
  return state
}

module.exports = {
  deploy,
  remove
}
