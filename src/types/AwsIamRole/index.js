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

  await attachRolePolicy(IAM, {
    name,
    policy
  })

  return roleRes.Role.Arn
}

const deleteRole = async (IAM, { name, policy }) => {
  try {
    await detachRolePolicy(IAM, {
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

  return null
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

const AwsIamRole = {
  construct({ provider, name, service, policy }) {
    this.provider = provider
    this.roleName = name
    this.service = service
    this.policy = policy
  },
  async deploy(prevInstance, context) {
    console.log('iam')
    const AWS = this.provider.getSdk()
    const IAM = new AWS.IAM()

    if (!this.policy) {
      this.policy = {
        arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
      }
    }

    // this.arn = 'abc'

    // if (!prevInstance) {
    //   context.log(`Creating Role: ${this.name}`)
    //   this.arn = await createRole(IAM, this)
    // } else if (!this.name && prevInstance.name) {
    //   context.log(`Removing Role: ${prevInstance.name}`)
    //   this.arn = await deleteRole(IAM, prevInstance)
    // } else if (prevInstance.name !== this.name) {
    //   context.log(`Removing Role: ${prevInstance.name}`)
    //   await deleteRole(IAM, prevInstance)
    //   context.log(`Creating Role: ${this.name}`)
    //   this.arn = await createRole(IAM, this)
    // } else {
    //   if (prevInstance.service !== this.service) {
    //     await updateAssumeRolePolicy(IAM, this)
    //   }
    //   if (!equals(prevInstance.policy, this.policy)) {
    //     await detachRolePolicy(IAM, this)
    //     await attachRolePolicy(IAM, this)
    //   }
    // }

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
