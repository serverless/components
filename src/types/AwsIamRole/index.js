import BbPromise from 'bluebird'
import { equals } from 'ramda'

const attachRolePolicy = async (IAM, { name, policy }) => {
  await IAM.attachRolePolicy({
    RoleName: name,
    PolicyArn: policy.arn
  }).promise()

  return BbPromise.delay(15000)
}

const detachRolePolicy = async (IAM, { name, policy }) => {
  await IAM.detachRolePolicy({
    RoleName: name,
    PolicyArn: policy.arn
  }).promise()
}

const createRole = async (IAM, { name, service, policy }) => {
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

const deleteRole = async (IAM, { name, policy }) => {
  try {
    await detachRolePolicy({
      name,
      policy
    })
  } catch (error) {
    if (error.message !== `Policy ${policy.arn} was not found.`) {
      throw error
    }
  }

  await IAM.deleteRole({
    RoleName: name
  }).promise()

  return {
    policy: null,
    service: null,
    arn: null
  }
}

const updateAssumeRolePolicy = async (IAM, { name, service }) => {
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

export const deploy = async (instance, context) => {
  const IAM = new instance.provider.getSdk().IAM
  let props = {
    name: instance.name,
    service: instance.service,
    policy: instance.policy
  }
  let { state } = context

  if (!props.policy) {
    props = {
      ...props,
      policy: {
        arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
      }
    }
  }

  if (!state.name && props.name) {
    context.log(`Creating Role: ${props.name}`)
    const role = await createRole(IAM, props)
    state = {
      ...state,
      ...role,
      name: props.name
    }
  } else if (!props.name && state.name) {
    context.log(`Removing Role: ${state.name}`)
    await deleteRole(IAM, state)
    state = {
      ...state,
      name: null
    }
  } else if (state.name !== props.name) {
    context.log(`Removing Role: ${state.name}`)
    await deleteRole(IAM, state)
    context.log(`Creating Role: ${props.name}`)
    const role = await createRole(IAM, props)
    state = {
      ...state,
      ...role,
      name: props.name
    }
  } else {
    if (state.service !== props.service) {
      await updateAssumeRolePolicy(IAM, props)
    }
    if (!equals(state.policy, props.policy)) {
      await detachRolePolicy(IAM, props)
      await attachRolePolicy(IAM, props)
    }
  }

  context.saveState(state)
  return state
}

export const remove = async (instance, context) => {
  const IAM = new instance.provider.getSdk().IAM
  if (!context.state.name) return {}

  const outputs = {
    policy: null,
    service: null,
    arn: null
  }

  try {
    context.log(`Removing Role: ${context.state.name}`)
    await deleteRole(IAM, context.state)
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
