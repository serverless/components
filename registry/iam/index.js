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

  return {
    arn: roleRes.Role.Arn
  }
}

const deleteRole = async (name) => {
  await IAM.detachRolePolicy({
    RoleName: name,
    PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess'
  }).promise()

  await IAM.deleteRole({
    RoleName: name
  }).promise()

  return {
    arn: null
  }
}

const deploy = async (inputs, context) => {
  let outputs = context.state
  if (!context.state.name && inputs.name) {
    context.log(`Creating Role: ${inputs.name}`)
    outputs = await createRole(inputs)
  } else if (!inputs.name && context.state.name) {
    context.log(`Removing Role: ${context.state.name}`)
    outputs = await deleteRole(context.state.name)
  } else if (context.state.name !== inputs.name) {
    context.log(`Removing Role: ${context.state.name}`)
    await deleteRole(context.state.name)
    context.log(`Creating Role: ${inputs.name}`)
    outputs = await createRole(inputs)
  }
  context.saveState({ ...inputs, ...outputs })
  return outputs
}

const remove = async (inputs, context) => {
  context.log(`Removing Role: ${context.state.name}`)
  const outputs = await deleteRole(context.state.name)
  context.saveState()
  return outputs
}

module.exports = {
  deploy,
  remove
}
