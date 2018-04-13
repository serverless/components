const AWS = require('aws-sdk')
const BbPromise = require('bluebird')
const { equals } = require('ramda')

const IAM = new AWS.IAM({ region: 'us-east-1' })

const attachRolePolicy = async ({ name, policy }) => {
  await IAM.attachRolePolicy({
    RoleName: name,
    PolicyArn: policy.arn
  }).promise()

  return BbPromise.delay(15000)
}

const detachRolePolicy = async ({ name, policy }) => {
  await IAM.detachRolePolicy({
    RoleName: name,
    PolicyArn: policy.arn
  }).promise()
}

const createRole = async ({ name, service, policy }) => {
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

  await attachRolePolicy({
    name,
    policy
  })

  return {
    arn: roleRes.Role.Arn,
    service,
    policy
  }
}

const deleteRole = async ({ name, policy }) => {
  await detachRolePolicy({
    name,
    policy
  })
  await IAM.deleteRole({
    RoleName: name
  }).promise()

  return {
    policy: null,
    service: null,
    arn: null
  }
}

const updateAssumeRolePolicy = async ({ name, service }) => {
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
  await IAM.updateAssumeRolePolicy({
    RoleName: name,
    PolicyDocument: JSON.stringify(assumeRolePolicyDocument)
  }).promise()
}

const rollback = async (inputs, context) => {
  const { archive, state } = context
  if (!archive.name && state.name) {
    context.log(`Removing Role: ${state.name}`)
    await deleteRole(state)
  } else if (archive.name && !state.name) {
    context.log(`Creating Role: ${archive.name}`)
    await createRole(archive)
  } else if (archive.name !== state.name) {
    context.log(`Removing Role: ${state.name}`)
    await deleteRole(state)
    context.log(`Creating Role: ${archive.name}`)
    await createRole(archive)
  } else {
    if (archive.service !== state.service) {
      await updateAssumeRolePolicy(archive)
    }
    if (!equals(archive.policy, state.policy)) {
      await detachRolePolicy(state)
      await attachRolePolicy(archive)
    }
  }
  return archive
}

const deploy = async (inputs, context) => {
  let { state } = context

  if (!inputs.policy) {
    inputs = {
      ...inputs,
      policy: {
        arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
      }
    }
  }

  if (!state.name && inputs.name) {
    context.log(`Creating Role: ${inputs.name}`)
    const role = await createRole(inputs)
    state = {
      ...state,
      ...role,
      name: inputs.name
    }
  } else if (!inputs.name && state.name) {
    context.log(`Removing Role: ${state.name}`)
    await deleteRole(state)
    state = {
      ...state,
      name: null
    }
  } else if (state.name !== inputs.name) {
    context.log(`Removing Role: ${state.name}`)
    await deleteRole(state)
    context.log(`Creating Role: ${inputs.name}`)
    const role = await createRole(inputs)
    state = {
      ...state,
      ...role,
      name: inputs.name
    }
  } else {
    if (state.service !== inputs.service) {
      await updateAssumeRolePolicy(inputs)
    }
    if (!equals(state.policy, inputs.policy)) {
      await detachRolePolicy(state)
      await attachRolePolicy(inputs)
    }
  }

  context.saveState(state)
  return state
}

const remove = async (inputs, context) => {
  if (!context.state.name) return {}

  const outputs = {
    policy: null,
    service: null,
    arn: null
  }
  try {
    context.log(`Removing Role: ${context.state.name}`)
    await deleteRole(context.state)
  } catch (e) {
    if (!e.message.includes('Role not found')) {
      throw new Error(e)
    }
  }
  context.saveState({
    name: null,
    arn: null,
    service: null,
    policy: null
  })

  return outputs
}

module.exports = {
  deploy,
  remove,
  rollback
}
