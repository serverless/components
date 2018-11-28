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

    async shouldDeploy(prevInstance) {
      // 1. run sls deploy for the first time: Framework creates role
      // 2. run sls deploy again without changes: Framework does nothing
      // 3. change service property in serverless.yml and run sls deploy: Framework updates role
      // 4. change roleName and run sls deploy: Framework removes prev role and create new role
      // 5. change service property in AWS console and run sls deploy: Framework updates role with service in serverless.yml
      // 6. delete role in console and run sls deploy: Framework creates role again
      // 7. create role in aws console and deploy for the first time without updates: Framework does nothing
      // 8. create role in aws console and deploy for the first time after config changes in serverless.yml: Framework makes an update
      // NOTE: "resource does not exist" AND "resource already exists" errors should not be thrown.

      const { provider } = this
      const AWS = provider.getSdk()
      const IAM = new AWS.IAM()

      // Eslam - Because we don't support create/update methods,
      // we need a way to communicate with the deploy
      // method whether we should create or update
      // so we have to use the context instead,
      // otherwise the deploy method would have
      // to check with the provider again...
      this.newRoleExists = true
      this.prevRoleExists = false

      const config = {
        roleName: this.roleName,
        service: this.service,
        policy: this.policy
      }

      this.prevConfig = prevInstance ? pick(keys(config), prevInstance) : {}

      // 1. Check new role
      try {
        const res = await IAM.getRole({ RoleName: this.roleName }).promise()
        this.newRoleExists = true
        this.prevConfig.roleName = res.Role.RoleName
        this.prevConfig.service = JSON.parse(
          decodeURIComponent(res.Role.AssumeRolePolicyDocument)
        ).Statement[0].Principal.Service
        this.prevConfig.policy = this.prevConfig.policy
      } catch (e) {
        if (e.message.includes('cannot be found')) {
          this.newRoleExists = false
        } else {
          throw e
        }
      }

      const configChanged = not(equals(config, this.prevConfig))

      // 2. Check prev role, if any...
      if (prevInstance) {
        try {
          await IAM.getRole({ RoleName: prevInstance.roleName }).promise()
          this.prevRoleExists = true
        } catch (e) {
          if (e.message.includes('cannot be found')) {
            this.prevRoleExists = false
          } else {
            throw e
          }
        }
      }

      if (
        prevInstance &&
        prevInstance.roleName !== config.roleName &&
        this.prevRoleExists &&
        !this.newRoleExists
      ) {
        return 'replace'
      }

      if (!this.newRoleExists || configChanged) {
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

      if (!this.newRoleExists) {
        context.log(`Creating Role: ${this.roleName}`)
        this.arn = await createRole(IAM, {
          roleName: this.roleName,
          service: this.service,
          policy: this.policy
        })
      } else {
        if (this.prevConfig.service !== this.service) {
          await updateAssumeRolePolicy(IAM, this)
        }
        if (!equals(this.prevConfig.policy, this.policy)) {
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
