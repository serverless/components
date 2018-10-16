import { all, sleep } from '@serverless/utils'

const createPolicy = async (IAM, { policyName, document }, context) => {
  const policyRes = await IAM.createPolicy({
    PolicyName: policyName,
    Path: '/',
    PolicyDocument: JSON.stringify(document)
  }).promise()
  context.log(`Policy '${policyName}' created with arn: '${policyRes.Policy.Arn}'`)

  await sleep(15000)

  return policyRes.Policy.Arn
}

const deletePolicy = async (IAM, name, arn, context) => {
  const { PolicyGroups, PolicyRoles, PolicyUsers } = await IAM.listEntitiesForPolicy({
    PolicyArn: arn
  }).promise()

  await all(
    PolicyGroups.map((group) => IAM.detachGroupPolicy({ GroupName: group })),
    PolicyRoles.map((role) => IAM.detachRolePolicy({ RoleName: role })),
    PolicyUsers.map((user) => IAM.detachUserPolicy({ UserName: user }))
  )

  await IAM.deletePolicy({
    PolicyArn: arn
  }).promise()
  context.log(`Policy '${name}' deleted.`)

  return null
}

const AwsIamPolicy = (SuperClass) =>
  class extends SuperClass {
    shouldDeploy(prevInstance) {
      if (!prevInstance) {
        return 'deploy'
      }
      if (prevInstance.policyName !== this.policyName) {
        return 'replace'
      }
    }

    async deploy(prevInstance, context) {
      const AWS = this.provider.getSdk()
      const IAM = new AWS.IAM()

      context.log(`Creating Policy: ${this.policyName}`)
      this.arn = await createPolicy(IAM, this, context)
    }

    async remove(context) {
      const AWS = this.provider.getSdk()
      const IAM = new AWS.IAM()

      try {
        context.log(`Removing Policy: ${this.policyName}`)
        this.arn = await deletePolicy(IAM, this.policyName, this.arn, context)
      } catch (e) {
        if (!e.message.includes('does not exist or is not attachable')) {
          throw new Error(e)
        }
      }
    }
  }

export default AwsIamPolicy
