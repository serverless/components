import {
  get,
  equals,
  is,
  isEmpty,
  has,
  resolve,
  sleep,
  or,
  resolvable,
  not,
  pick,
  keys
} from '@serverless/utils'

const addRolePolicy = async (IAM, { roleName, policy }) => {
  if (has('arn', policy)) {
    await IAM.attachRolePolicy({
      RoleName: roleName,
      PolicyArn: policy.arn
    }).promise()
  } else if (!isEmpty(policy)) {
    await IAM.putRolePolicy({
      RoleName: roleName,
      PolicyName: `${roleName}-policy`,
      PolicyDocument: JSON.stringify(policy)
    }).promise()
  }

  return sleep(15000)
}

const removeRolePolicy = async (IAM, { roleName, policy }) => {
  if (has('arn', policy)) {
    await IAM.detachRolePolicy({
      RoleName: roleName,
      PolicyArn: policy.arn
    }).promise()
  } else if (!isEmpty(policy)) {
    await IAM.deleteRolePolicy({
      RoleName: roleName,
      PolicyName: `${roleName}-policy`
    }).promise()
  }
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

  await addRolePolicy(IAM, {
    roleName,
    policy
  })

  return roleRes.Role.Arn
}

const deleteRole = async (IAM, { roleName, policy }) => {
  try {
    await removeRolePolicy(IAM, {
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

const AwsIamRole = async (SuperClass, superContext) => {
  const AwsIamPolicy = await superContext.import('AwsIamPolicy')

  return class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)

      // TODO: remove this validation once core supports full RAML spec
      const roleNameMaxLength = this.inputTypes.roleName.maxLength
      if (inputs.roleName && inputs.roleName.length > roleNameMaxLength) {
        throw new Error(
          `IAM role name "${inputs.roleName}" is ${
            inputs.roleName.length
          } characters long (max. allowed length is 64)`
        )
      }

      this.provider = inputs.provider
      this.service = inputs.service
      this.roleName = resolvable(() => or(inputs.roleName, `role-${this.instanceId}`))
    }

    hydrate(prevInstance) {
      super.hydrate(prevInstance)
      this.arn = get('arn', prevInstance)
    }

    async sync() {
      let { provider } = this
      provider = resolve(provider)
      const AWS = provider.getSdk()
      const IAM = new AWS.IAM()

      try {
        const res = await IAM.getRole({ RoleName: resolve(this.roleName) }).promise()
        this.roleName = res.Role.RoleName
        this.service = JSON.parse(
          decodeURIComponent(res.Role.AssumeRolePolicyDocument)
        ).Statement[0].Principal.Service
      } catch (e) {
        if (e.message.includes('cannot be found')) {
          return 'removed'
        }
        throw e
      }
    }

    shouldDeploy(prevInstance) {
      const inputs = {
        roleName: this.roleName,
        service: this.service,
        policy: this.policy
      }
      const prevInputs = prevInstance ? pick(keys(inputs), prevInstance) : {}
      const configChanged = not(equals(inputs, prevInputs))

      if (prevInstance && prevInstance.roleName !== inputs.roleName) {
        return 'replace'
      } else if (!prevInstance || configChanged) {
        return 'deploy'
      }
    }

    async define() {
      const policy = resolve(this.policy)
      if (is(AwsIamPolicy.class, policy)) {
        return {
          policy
        }
      }
      return {}
    }

    async deploy(prevInstance, context) {
      const { provider } = this
      const AWS = provider.getSdk()
      const IAM = new AWS.IAM()

      if (!prevInstance || this.roleName !== prevInstance.roleName) {
        context.log(`Creating Role: ${this.roleName}`)
        this.arn = await createRole(IAM, {
          roleName: this.roleName,
          service: this.service,
          policy: this.policy
        })
      } else {
        if (prevInstance.service !== this.service) {
          await updateAssumeRolePolicy(IAM, this)
        }
        if (!equals(prevInstance.policy, this.policy)) {
          await removeRolePolicy(IAM, prevInstance)
          await addRolePolicy(IAM, { roleName: this.roleName, policy: this.policy })
        }
      }
    }

    async remove(context) {
      const { provider } = this
      const AWS = provider.getSdk()
      const IAM = new AWS.IAM()

      try {
        context.log(`Removing Role: ${this.roleName}`)
        this.arn = await deleteRole(IAM, this)
      } catch (error) {
        if (error.code !== 'NoSuchEntity') {
          throw error
        }
      }
    }

    async info() {
      return {
        title: this.roleName,
        type: this.name,
        data: {
          arn: this.arn,
          service: this.service,
          policy: this.policy
        }
      }
    }
  }
}

export default AwsIamRole
