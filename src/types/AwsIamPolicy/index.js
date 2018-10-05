import BbPromise from 'bluebird'

const createPolicy = async (IAM, { name, document }) => {
  const policyRes = await IAM.createPolicy({
    PolicyName: name,
    Path: '/',
    PolicyDocument: JSON.stringify(document)
  }).promise()
  console.log(`Policy '${name}' created with arn: '${policyRes.Policy.Arn}'`)

  await BbPromise.delay(15000)

  return {
    arn: policyRes.Policy.Arn
  }
}

const deletePolicy = async (IAM, name, arn) => {
  const { PolicyGroups, PolicyRoles, PolicyUsers } = await IAM.listEntitiesForPolicy({
    PolicyArn: arn
  }).promise()

  await Promise.all(
    PolicyGroups.map((group) => IAM.detachGroupPolicy({ GroupName: group })),
    PolicyRoles.map((role) => IAM.detachRolePolicy({ RoleName: role })),
    PolicyUsers.map((user) => IAM.detachUserPolicy({ UserName: user }))
  )

  await IAM.deletePolicy({
    PolicyArn: arn
  }).promise()
  console.log(`Policy '${name}' deleted.`)

  return {
    arn: null
  }
}

const AwsIamPolicy = {
  async deploy(prevInstance, context) {
    const IAM = new this.provider.getSdk().IAM()
    const state = context.getState(this)
    if (!state.name && this.name) {
      context.log(`Creating Policy: ${this.name}`)
      this.arn = await createPolicy(IAM, this)
    } else if (!this.name && state.name) {
      context.log(`Removing Policy: ${state.name}`)
      this.arn = await deletePolicy(IAM, state.name, state.arn)
    } else if (state.name !== this.name) {
      context.log(`Removing Policy: ${state.name}`)
      await deletePolicy(IAM, state.name, state.arn)
      context.log(`Creating Policy: ${this.name}`)
      this.arn = await createPolicy(IAM, this)
    }

    const newState = {
      provider: this.provider,
      name: this.name,
      document: this.document,
      arn: this.arn
    }

    context.saveState(this, newState)
  },
  async remove(prevInstance, context) {
    const IAM = new this.provider.getSdk().IAM()
    const state = context.getState(this)
    if (!state.name) return {}

    try {
      context.log(`Removing Policy: ${state.name}`)
      await deletePolicy(IAM, state.name, state.arn)
    } catch (e) {
      if (!e.message.includes('does not exist or is not attachable')) {
        throw new Error(e)
      }
    }

    context.saveState(this, {})
  }
}

export default AwsIamPolicy
