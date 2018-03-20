const AWS = require('aws-sdk')
const BbPromise = require('bluebird')

const IAM = new AWS.IAM({ region: 'us-east-1' })

const createRole = async ({ name, service }) => {
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

  await IAM.attachRolePolicy({
    RoleName: name,
    PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess'
  }).promise()

  await BbPromise.delay(15000)

  return roleRes.Role.Arn
}

const deleteRole = async (name) => {
  await IAM.detachRolePolicy({
    RoleName: name,
    PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess'
  }).promise()

  await IAM.deleteRole({
    RoleName: name
  }).promise()

  return null
}

const rollback = async (inputs, context) => {
  if (!context.archive.name && context.state.name) {
    context.log(`Removing Role: ${context.state.name}`)
    await deleteRole(context.state.name)
  } else if (context.archive.name && !context.state.name) {
    context.log(`Creating Role: ${context.archive.name}`)
    await createRole({ name: context.archive.name, service: inputs.service })
  } else if (context.archive.name !== context.state.name) {
    context.log(`Removing Role: ${context.state.name}`)
    await deleteRole(context.state.name)
    context.log(`Creating Role: ${context.archive.name}`)
    await createRole({ name: context.archive.name, service: inputs.service })
  }
  const outputs = { arn: context.archive.arn }
  return outputs
}

const deploy = async (inputs, context) => {
  let state = {}
  if (!context.state.name && inputs.name) {
    context.log(`Creating Role: ${inputs.name}`)
    state.arn = await createRole(inputs)
    state.name = inputs.name
  } else if (!inputs.name && context.state.name) {
    context.log(`Removing Role: ${context.state.name}`)
    state.arn = await deleteRole(context.state.name)
    state.name = null
  } else if (context.state.name !== inputs.name) {
    context.log(`Removing Role: ${context.state.name}`)
    await deleteRole(context.state.name)
    context.log(`Creating Role: ${inputs.name}`)
    state.arn = await createRole(inputs)
    state.name = inputs.name
  } else {
    state = context.state // eslint-disable-line
  }
  const outputs = {
    arn: state.arn || 'abc'
  }
  context.saveState(state)
  return outputs
}

const remove = async (inputs, context) => {
  context.log(`Removing Role: ${context.state.name}`)
  const outputs = await deleteRole(context.state.name)
  context.saveState({ name: null, arn: null })
  return outputs
}

module.exports = {
  deploy,
  remove,
  rollback
}
