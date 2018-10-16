import { pick, not, isEmpty, equals } from 'ramda'

const AwsEventsRule = {
  async deploy(prevInstance, context) {
    const AWS = this.provider.getSdk()
    const cloudWatchEvents = new AWS.CloudWatchEvents()
    const lambda = new AWS.Lambda()

    context.log('Creating Schedule')

    this.functionRuleName = this.lambda.arn.split(':')[this.lambda.arn.split(':').length - 1]

    const inputsProps = ['name', 'lambdaArn', 'schedule', 'enabled']
    const inputs = pick(inputsProps, this)
    const prevInputs = pick(inputsProps, prevInstance)
    const noChanges = equals(inputs, prevInputs)

    if (noChanges) {
      return this
    } else if (not(isEmpty(prevInstance))) {
      await this.remove(context)
    }

    const State = this.enabled ? 'ENABLED' : 'DISABLED'
    const putRuleParams = {
      Name: this.functionRuleName,
      ScheduleExpression: this.schedule,
      State
    }

    const putRuleRes = await cloudWatchEvents.putRule(putRuleParams).promise()

    this.arn = putRuleRes.RuleArn

    const putTargetsParams = {
      Rule: this.functionRuleName,
      Targets: [
        {
          Arn: this.lambda.arn,
          Id: this.functionRuleName
        }
      ]
    }

    await cloudWatchEvents.putTargets(putTargetsParams).promise()

    const addPermissionParams = {
      Action: 'lambda:InvokeFunction',
      FunctionName: this.functionRuleName,
      StatementId: this.functionRuleName,
      Principal: 'events.amazonaws.com'
    }

    await lambda.addPermission(addPermissionParams).promise()
  },

  async remove(prevInstance) {
    if (!prevInstance.name) return this
    const cloudWatchEvents = new this.provider.sdk.CloudWatchEvents()
    const removeTargetsParams = {
      Rule: this.name,
      Ids: [this.name]
    }

    await cloudWatchEvents.removeTargets(removeTargetsParams).promise()

    const deleteRuleParams = {
      Name: this.name
    }

    await cloudWatchEvents.deleteRule(deleteRuleParams).promise()

    return this
  }
}

export default AwsEventsRule
