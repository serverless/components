const AWS = require('aws-sdk')
const BbPromise = require('bluebird')

const IAM = new AWS.IAM({ region: 'us-east-1' })

const create = async ({name, service}) => {
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

const remove = async (name) => {
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

module.exports = async (inputs, state) => {
  let outputs = state
  if (!state.name && inputs.name) {
    console.log(`Creating Role: ${inputs.name}`)
    outputs = await create(inputs)
  } else if (!inputs.name && state.name) {
    console.log(`Removing Role: ${state.name}`)
    outputs = await remove(state.name)
  } else if (state.name !== inputs.name) {
    console.log(`Removing Role: ${state.name}`)
    await remove(state.name)
    console.log(`Creating Role: ${inputs.name}`)
    outputs = await create(inputs)
  }
  return outputs
}
