/* eslint-disable no-console */

const AWS = require('aws-sdk')
const BbPromise = require('bluebird')

const IAM = new AWS.IAM({ region: 'us-east-1' })

const createRole = async ({ name, service, policyArn }) => {
  const assumeRolePolicyDocument = {
    Version: '2012-10-17',
    Statement: {
      Effect: 'Allow',
      Principal: {
        Service: service
      },
      Action: 'sts:AssumeRole'
    }
  }

  const roleRes = await IAM.createRole({
    RoleName: name,
    Path: '/',
    AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicyDocument)
  }).promise()
  console.log(`Role '${name}' created.`)

  console.log(`Attaching role '${name}' to policy with arn: '${policyArn}'.`)
  await IAM.attachRolePolicy({
    RoleName: name,
    PolicyArn: policyArn
  }).promise()
  console.log(`Role '${name}' attached to policy with arn: '${policyArn}'.`)

  await BbPromise.delay(15000)

  return {
    roleArn: roleRes.Role.Arn
  }
}

const deleteRole = async (name, policyArn) => {
  await IAM.detachRolePolicy({
    RoleName: name,
    PolicyArn: policyArn
  }).promise()
  console.log(`Role '${name}' detached from policy.`)

  await IAM.deleteRole({
    RoleName: name
  }).promise()
  console.log(`Role '${name}' deleted.`)

  return {
    roleArn: null
  }
}

const deploy = async (inputs, context) => {
  let outputs = context.state
  if (!context.state.name && inputs.name) {
    context.log(`Creating Role: ${inputs.name}`)
    outputs = await createRole(inputs)
  } else if (!inputs.name && context.state.name) {
    context.log(`Removing Role: ${context.state.name}`)
    outputs = await deleteRole(context.state.name, context.state.policyArn)
  } else if (context.state.name !== inputs.name) {
    context.log(`Removing Role: ${context.state.name}`)
    await deleteRole(context.state.name, context.state.policyArn)
    context.log(`Creating Role: ${inputs.name}`)
    outputs = await createRole(inputs)
  }
  context.saveState({ ...inputs, ...outputs })
  return outputs
}

const remove = async (inputs, context) => {
  if (!context.state.name) return {}

  context.log(`Removing Role: ${context.state.name}`)
  await deleteRole(context.state.name, context.state.policyArn)
  context.saveState({})
  return {}
}

module.exports = {
  deploy,
  remove
}
