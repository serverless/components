import { isEmpty, not, equals, pick } from 'ramda'

const AwsEventsRule = {
  construct(inputs) {
    this.lambdaArn = inputs.lambdaArn
    this.schedule = inputs.schedule
    this.enabled = inputs.enabled
    // this.name = inputs.lambdaArn.split(':')[inputs.lambdaArn.split(':').length - 1]
    this.ruleName = 'abc'
  },

  async deploy(prevInstance, context) {
    console.log('schedule')
    // const inputsProps = ['name', 'lambdaArn', 'schedule', 'enabled']
    // const inputs = pick(inputsProps, this)
    // const prevInputs = pick(inputsProps, prevInstance)
    // const noChanges = equals(inputs, prevInputs)
    //
    // if (noChanges) {
    //   return this
    // } else if (not(isEmpty(prevInstance))) {
    //   await this.remove(context)
    // }
    //
    // const cloudWatchEvents = new this.provider.sdk.CloudWatchEvents()
    //
    // const State = this.enabled ? 'ENABLED' : 'DISABLED'
    // const putRuleParams = {
    //   Name: this.name,
    //   ScheduleExpression: this.schedule,
    //   State
    // }
    //
    // const putRuleRes = await cloudWatchEvents.putRule(putRuleParams).promise()
    //
    // this.arn = putRuleRes.RuleArn
    //
    // const putTargetsParams = {
    //   Rule: this.name,
    //   Targets: [
    //     {
    //       Arn: this.lambdaArn,
    //       Id: this.name
    //     }
    //   ]
    // }
    //
    // await cloudWatchEvents.putTargets(putTargetsParams).promise()
    //
    // const lambda = new this.provider.sdk.Lambda()
    //
    // const addPermissionParams = {
    //   Action: 'lambda:InvokeFunction',
    //   FunctionName: this.name,
    //   StatementId: this.name,
    //   Principal: 'events.amazonaws.com'
    // }
    //
    // await lambda.addPermission(addPermissionParams).promise()
    //
    // return this
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
