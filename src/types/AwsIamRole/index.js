import BbPromise from 'bluebird'
import { equals } from 'ramda'

const attachRolePolicy = async (IAM, { roleName, policy }) => {
  await IAM.attachRolePolicy({
    RoleName: roleName,
    PolicyArn: policy.arn
  }).promise()

  return BbPromise.delay(15000)
}

const detachRolePolicy = async (IAM, { roleName, policy }) => {
  await IAM.detachRolePolicy({
    RoleName: roleName,
    PolicyArn: policy.arn
  }).promise()
}

const createRole = async (IAM, { roleName, service, policy }) => {
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
    RoleName: roleName,
    Path: '/',
    AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicyDocument)
  }).promise()

  await attachRolePolicy(IAM, {
    roleName,
    policy
  })

  return roleRes.Role.Arn
}

const deleteRole = async (IAM, { roleName, policy }) => {
  try {
    await detachRolePolicy(IAM, {
      roleName,
      policy
    })
  } catch (error) {
    if (error.message !== `Policy ${policy.arn} was not found.`) {
      throw error
    }
  }

  await IAM.deleteRole({
    RoleName: roleName
  }).promise()

  return null
}

const updateAssumeRolePolicy = async (IAM, { roleName, service }) => {
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
    RoleName: roleName,
    PolicyDocument: JSON.stringify(assumeRolePolicyDocument)
  }).promise()
}

const AwsIamRole = {
  construct({ provider, name, service, policy }) {
    this.provider = provider
    this.roleName = name
    this.service = service
    this.policy = policy
  },
  async deploy(prevInstance, context) {
    const AWS = this.provider.getSdk()
    const IAM = new AWS.IAM()

    if (!this.policy) {
      this.policy = {
        arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
      }
    }
    //
    if (!prevInstance) {
      context.log(`Creating Role: ${this.roleName}`)
      this.arn = await createRole(IAM, this)
    } else if (!this.roleName && prevInstance.roleName) {
      context.log(`Removing Role: ${prevInstance.roleName}`)
      this.arn = await deleteRole(IAM, prevInstance)
    } else if (prevInstance.roleName !== this.roleName) {
      context.log(`Removing Role: ${prevInstance.roleName}`)
      await deleteRole(IAM, prevInstance)
      context.log(`Creating Role: ${this.roleName}`)
      this.arn = await createRole(IAM, this)
    } else {
      if (prevInstance.service !== this.service) {
        await updateAssumeRolePolicy(IAM, this)
      }
      if (!equals(prevInstance.policy, this.policy)) {
        await detachRolePolicy(IAM, this)
        await attachRolePolicy(IAM, this)
      }
    }

    // await context.saveState(this, { arn: this.arn })
  },

  async remove(prevInstance, context) {
    const IAM = new this.provider.sdk.IAM()
    if (!prevInstance.name) return this

    try {
      context.log(`Removing Role: ${prevInstance.name}`)
      this.arn = await deleteRole(IAM, prevInstance)
    } catch (e) {
      if (!e.message.includes('Role not found')) {
        throw new Error(e)
      }
    }
  }
}

export default AwsIamRole
