const BbPromise = require('bluebird')
const R = require('ramda')

const attachRolePolicy = async ({ name, policy }, IAM) => {
  await IAM.attachRolePolicy({
    RoleName: name,
    PolicyArn: policy.arn
  }).promise()

  return BbPromise.delay(15000)
}

const detachRolePolicy = async ({ name, policy }, IAM) => {
  await IAM.detachRolePolicy({
    RoleName: name,
    PolicyArn: policy.arn
  }).promise()
}

const createRole = async ({ name, service, policy }, IAM) => {
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
  }, IAM)

  return {
    arn: roleRes.Role.Arn,
    service,
    policy
  }
}

const deleteRole = async ({ name, policy }, IAM) => {
  await detachRolePolicy({
    name,
    policy
  }, IAM)
  await IAM.deleteRole({
    RoleName: name
  }).promise()

  return {
    policy: null,
    service: null,
    arn: null
  }
}

const updateAssumeRolePolicy = async ({ name, service }, IAM) => {
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
    if (!R.equals(archive.policy, state.policy)) {
      await detachRolePolicy(state)
      await attachRolePolicy(archive)
    }
  }
  return archive
}

const deploy = async (inputs, context) => {
  const IAM = new context.provider.AWS.IAM({ region: 'us-east-1' })
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
    const role = await createRole(inputs, IAM)
    state = {
      ...state,
      ...role,
      name: inputs.name
    }
  } else if (!inputs.name && state.name) {
    context.log(`Removing Role: ${state.name}`)
    await deleteRole(state, IAM)
    state = {
      ...state,
      name: null
    }
  } else if (state.name !== inputs.name) {
    context.log(`Removing Role: ${state.name}`)
    await deleteRole(state, IAM)
    context.log(`Creating Role: ${inputs.name}`)
    const role = await createRole(inputs, IAM)
    state = {
      ...state,
      ...role,
      name: inputs.name
    }
  } else {
    if (state.service !== inputs.service) {
      await updateAssumeRolePolicy(inputs, IAM)
    }
    if (!R.equals(state.policy, inputs.policy)) {
      await detachRolePolicy(state, IAM)
      await attachRolePolicy(inputs, IAM)
    }
  }

  context.saveState(state)
  return state
}

const remove = async (inputs, context) => {
  const IAM = new context.provider.AWS.IAM({ region: 'us-east-1' })
  if (!context.state.name) return {}

  context.log(`Removing Role: ${context.state.name}`)
  const outputs = await deleteRole(context.state, IAM)
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
