/* eslint-disable no-console */

const AWS = require('aws-sdk')
const BbPromise = require('bluebird')

const IAM = new AWS.IAM({ region: 'us-east-1' })

const createPolicy = async ({ name, document }) => {
  const policyRes = await IAM.createPolicy({
    PolicyName: name,
    Path: '/',
    PolicyDocument: JSON.stringify(document)
  }).promise()
  console.log(`Policy '${name}' created with arn: '${policyRes.Policy.Arn}'`)

  await BbPromise.delay(15000)

  return {
    arn: policyRes.Policy.Arn
  }
}

const deletePolicy = async (name, arn) => {
  await IAM.deletePolicy({
    PolicyArn: arn
  }).promise()
  console.log(`Policy '${name}' deleted.`)

  return {
    arn: null
  }
}

const deploy = async (inputs, context) => {
  let outputs = context.state
  if (!context.state.name && inputs.name) {
    context.log(`Creating Policy: ${inputs.name}`)
    outputs = await createPolicy(inputs)
  } else if (!inputs.name && context.state.name) {
    context.log(`Removing Policy: ${context.state.name}`)
    outputs = await deletePolicy(context.state.name, context.state.arn)
  } else if (context.state.name !== inputs.name) {
    context.log(`Removing Policy: ${context.state.name}`)
    await deletePolicy(context.state.name, context.state.arn)
    context.log(`Creating Policy: ${inputs.name}`)
    outputs = await createPolicy(inputs)
  }
  context.saveState({ ...inputs, ...outputs })
  return outputs
}

const remove = async (inputs, context) => {
  if (!context.state.name) return {}

  try {
    context.log(`Removing Policy: ${context.state.name}`)
    await deletePolicy(context.state.name, context.state.arn)
  } catch (e) {
    if (!e.message.includes('does not exist or is not attachable')) {
      throw new Error(e)
    }
  }

  context.saveState({})
  return {}
}

module.exports = {
  deploy,
  remove
}
