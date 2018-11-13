import { get, all, sleep, map, or, resolvable, pick, keys, not, equals } from '@serverless/utils'

const createPolicy = async (IAM, { policyName, document }) => {
  const policyRes = await IAM.createPolicy({
    PolicyName: policyName,
    Path: '/',
    PolicyDocument: JSON.stringify(document)
  }).promise()

  await sleep(15000)

  return policyRes.Policy.Arn
}

const deletePolicy = async (IAM, arn) => {
  const { PolicyGroups, PolicyRoles, PolicyUsers } = await IAM.listEntitiesForPolicy({
    PolicyArn: arn
  }).promise()

  await all([
    all(
      map(
        (group) => IAM.detachGroupPolicy({ GroupName: group.GroupName, PolicyArn: arn }).promise(),
        PolicyGroups
      )
    ),
    all(
      map(
        (role) => IAM.detachRolePolicy({ RoleName: role.RoleName, PolicyArn: arn }).promise(),
        PolicyRoles
      )
    ),
    all(
      map(
        (user) => IAM.detachUserPolicy({ UserName: user.UserName, PolicyArn: arn }).promise(),
        PolicyUsers
      )
    )
  ])
  await IAM.deletePolicy({
    PolicyArn: arn
  }).promise()

  return null
}

const AwsIamPolicy = (SuperClass) =>
  class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)

      this.provider = inputs.provider
      this.policyName = resolvable(() => or(inputs.policyName, `policy-${this.instanceId}`))
      this.document = inputs.document
    }

    hydrate(prevInstance) {
      super.hydrate(prevInstance)
      this.arn = get('arn', prevInstance)
    }

    shouldDeploy(prevInstance) {
      const inputs = {
        policyName: this.policyName,
        document: this.document
      }
      const prevInputs = prevInstance ? pick(keys(inputs), prevInstance) : {}
      const configChanged = not(equals(inputs, prevInputs))
      if (prevInstance && prevInstance.policyName !== inputs.policyName) {
        return 'replace'
      } else if (!prevInstance || configChanged) {
        return 'deploy'
      }
    }

    async deploy(prevInstance, context) {
      const AWS = this.provider.getSdk()
      const IAM = new AWS.IAM()

      if (!prevInstance || prevInstance.policyName !== this.policyName) {
        context.log(`Creating Policy: ${this.policyName}`)
        this.arn = await createPolicy(IAM, {
          policyName: this.policyName,
          document: this.document
        })
        context.log(`Policy '${this.policyName}' created with arn: '${this.arn}'`)
      } else {
        context.log(`Updating Policy: ${this.policyName}`)
        // aws sdk does not have an api for updating policies
        // so we need to first remove (to avoid name conflicts)
        // then create a new one with the new document
        // console.log(prevInstance)
        await deletePolicy(IAM, prevInstance.arn)
        this.arn = await createPolicy(IAM, {
          policyName: this.policyName,
          document: this.document
        })
        context.log(`Policy '${this.policyName}' updated.`)
      }
    }

    async remove(context) {
      const AWS = this.provider.getSdk()
      const IAM = new AWS.IAM()

      try {
        context.log(`Removing Policy: ${this.policyName}`)
        await deletePolicy(IAM, this.arn)
        context.log(`Policy '${this.policyName}' removed.`)
      } catch (error) {
        if (error.code !== 'NoSuchEntity') {
          throw error
        }
      }
    }

    async info() {
      return {
        title: this.policyName,
        type: this.name,
        data: {
          arn: this.arn
        }
      }
    }
  }

export default AwsIamPolicy
